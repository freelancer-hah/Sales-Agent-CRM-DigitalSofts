"""
FastAPI Scraper Microservice for AI-Powered Company Lead Generation.
Uses Crawl4AI, BeautifulSoup, and polite rate-limited crawling.
"""

import os
import sys

# Configure Crawl4AI local directory before package imports
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
os.environ["CRAWL4_AI_BASE_DIRECTORY"] = os.path.join(CURRENT_DIR, ".crawl4ai")
sys.path.insert(0, CURRENT_DIR)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Dict, Any
import uvicorn

from crawler.polite_crawler import PoliteCrawler, is_safe_public_url
from extractors.contact_extractor import contact_extractor
from extractors.company_extractor import company_extractor
from extractors.decision_maker_extractor import decision_maker_extractor

app = FastAPI(
    title="LeadGen AI Web Scraping Service",
    version="1.0.0",
    description="Dedicated microservice for polite web crawling, content extraction, and decision maker discovery."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScrapeRequest(BaseModel):
    url: str
    max_pages: Optional[int] = 5


class ScrapeResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class JobSearchRequest(BaseModel):
    company_name: str
    location: Optional[str] = ""
    country: Optional[str] = ""
    results_wanted: Optional[int] = 15
    hours_old: Optional[int] = 720
    site_names: Optional[List[str]] = ["indeed", "linkedin", "glassdoor", "google"]


class JobSearchResponse(BaseModel):
    success: bool
    company_name: str
    total_found: int = 0
    jobs: List[Dict[str, Any]] = []
    error: Optional[str] = None


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "scraper-service",
        "version": "1.0.0",
        "crawler": "crawl4ai + beautifulsoup",
    }


@app.post("/scrape", response_model=ScrapeResponse)
async def scrape_company_website(request: ScrapeRequest):
    target_url = request.url.strip()

    # 1. SSRF and Protocol check
    if not is_safe_public_url(target_url):
        raise HTTPException(
            status_code=400,
            detail="Forbidden target URL: Localhost and private network addresses are strictly prohibited."
        )

    crawler = PoliteCrawler(timeout=8.0, max_pages=request.max_pages or 5)

    try:
        # 2. Crawl homepage and relevant internal pages
        pages = await crawler.crawl_site(target_url)

        if not pages:
            return ScrapeResponse(
                success=False,
                error="Website could not be reached, disallowed by robots.txt, or returned no crawlable HTML."
            )

        # 3. Extract company description
        description, desc_source_url = company_extractor.extract_description(pages)

        # 4. Extract services
        services_data = company_extractor.extract_services(pages)
        services = [s["service"] for s in services_data]

        # 5. Extract contact info
        contact_info = contact_extractor.extract(pages)

        # 6. Extract company size evidence
        all_text = " ".join(p["text"] for p in pages.values())
        home_url = pages.get("home", {}).get("url", target_url)
        company_size, size_source = company_extractor.extract_company_size(all_text, home_url)

        # 7. Extract social media links
        social_links = company_extractor.extract_social_links(pages)

        # 8. Extract decision-makers (CEOs, Founders, Directors, Managers)
        decision_makers = decision_maker_extractor.extract(pages)

        # 9. Combine source provenance records
        sources: List[Dict[str, Any]] = []

        if desc_source_url and description:
            sources.append({
                "sourceUrl": desc_source_url,
                "sourceType": "website_about" if "about" in desc_source_url else "website_home",
                "extractedField": "description",
                "supportingText": f"Extracted overview description from {desc_source_url}",
            })

        for s_item in services_data:
            sources.append({
                "sourceUrl": s_item["sourceUrl"],
                "sourceType": "website_services",
                "extractedField": "services",
                "supportingText": f"Service listed: {s_item['service']}",
            })

        sources.extend(contact_info["sources"])

        if size_source:
            sources.append(size_source)

        for dm in decision_makers:
            sources.append({
                "sourceUrl": dm["sourceUrl"],
                "sourceType": "website_team" if "team" in dm["sourceUrl"] else "website_about",
                "extractedField": "decision_maker",
                "supportingText": f"Identified {dm['fullName']} as {dm['jobTitle']} (Confidence: {dm['confidence']})",
            })

        return ScrapeResponse(
            success=True,
            data={
                "url": target_url,
                "description": description,
                "services": services,
                "products": [],
                "emails": contact_info["emails"],
                "phoneNumbers": contact_info["phoneNumbers"],
                "contactPageUrl": contact_info["contactPageUrl"],
                "hasContactForm": contact_info["hasContactForm"],
                "companySize": company_size,
                "socialLinks": social_links,
                "decisionMakers": decision_makers,
                "pagesCrawled": len(pages),
                "sources": sources,
            }
        )

    except Exception as e:
        return ScrapeResponse(
            success=False,
            error=f"Scraping failed: {str(e)}"
        )


def is_target_company_match(target_name: str, candidate_name: str) -> bool:
    t = target_name.strip().lower()
    c = candidate_name.strip().lower()
    if not t:
        return True
    if not c:
        return False
    if t in c or c in t:
        return True

    # Acronym matching (e.g. UET -> University of Engineering and Technology)
    stopwords = {'of', 'and', 'the', 'for', 'in', 'at', 'ltd', 'inc', 'pvt', 'llc', 'corp', 'co'}
    c_words = [w for w in re.findall(r'[a-zA-Z0-9]+', c) if w not in stopwords]
    c_initials = "".join(w[0] for w in c_words).lower()
    if t == c_initials or t in c_initials:
        return True

    t_words = [w for w in re.findall(r'[a-zA-Z0-9]+', t) if w not in stopwords]
    t_initials = "".join(w[0] for w in t_words).lower()
    if c == t_initials or t_initials in c:
        return True

    # Word token intersection (e.g. "UET Lahore" matching "UET" or "Lahore")
    t_set = {w for w in t_words if len(w) >= 3}
    c_set = {w for w in c_words if len(w) >= 3}
    if t_set and c_set and (t_set & c_set):
        return True

    return False


@app.post("/scrape-jobs", response_model=JobSearchResponse)
async def scrape_company_jobs(request: JobSearchRequest):
    company_name = request.company_name.strip()
    if not company_name:
        raise HTTPException(status_code=400, detail="company_name is required")

    try:
        from jobspy import scrape_jobs

        location_param = request.location.strip() if request.location else None
        country_param = (request.country or "").strip().lower()

        # Clean corporate suffixes and branch words for cleaner matching
        clean_name = re.sub(r'\b(pvt|ltd|limited|inc|corp|llc|branch|pk)\b', '', company_name, flags=re.IGNORECASE)
        clean_name = re.sub(r'\s+', ' ', clean_name).strip() or company_name

        # Check if country is recognized by Indeed
        supported_indeed = {"usa", "uk", "canada", "australia", "india", "france", "germany", "singapore", "netherlands", "spain", "italy", "mexico", "brazil"}
        country_indeed = country_param if country_param in supported_indeed else "usa"

        # If country is not natively supported by Indeed, prioritize LinkedIn and Google Jobs
        if request.site_names:
            sites = request.site_names
        elif country_param in supported_indeed:
            sites = ["indeed", "linkedin", "google"]
        else:
            sites = ["linkedin", "google"]

        df = None

        # Pass 1: Try with cleaned company name and location
        try:
            df = scrape_jobs(
                site_name=sites,
                search_term=clean_name,
                location=location_param,
                results_wanted=request.results_wanted or 15,
                hours_old=request.hours_old or 720,
                country_indeed=country_indeed,
                linkedin_fetch_description=False,
            )
        except Exception:
            df = None

        # Pass 2: Fallback without strict location constraint if Pass 1 yielded no results
        if df is None or df.empty:
            try:
                df = scrape_jobs(
                    site_name=["linkedin", "google"],
                    search_term=clean_name,
                    location=None,
                    results_wanted=request.results_wanted or 15,
                    hours_old=request.hours_old or 720,
                    linkedin_fetch_description=False,
                )
            except Exception:
                df = None

        if df is None or df.empty:
            return JobSearchResponse(
                success=True,
                company_name=company_name,
                total_found=0,
                jobs=[]
            )

        matched_jobs = []

        for _, row in df.iterrows():
            row_company = str(row.get("company", "") or "").strip()
            # Resilient company match against original name and clean name
            if is_target_company_match(company_name, row_company) or is_target_company_match(clean_name, row_company):
                title = str(row.get("title", "") or "").strip()
                site = str(row.get("site", "") or "").lower()
                loc = str(row.get("location", "") or "").strip()
                job_url = str(row.get("job_url", "") or "").strip()
                date_posted = str(row.get("date_posted", "") or "").strip()
                desc = str(row.get("description", "") or "").strip()

                salary = ""
                min_amt = row.get("min_amount")
                max_amt = row.get("max_amount")
                interval = str(row.get("interval", "") or "")
                currency = str(row.get("currency", "") or "$")
                if min_amt and max_amt:
                    try:
                        salary = f"{currency}{int(min_amt):,} - {currency}{int(max_amt):,} {interval}".strip()
                    except (ValueError, TypeError):
                        salary = f"{currency}{min_amt} - {currency}{max_amt} {interval}".strip()
                elif min_amt:
                    try:
                        salary = f"{currency}{int(min_amt):,}+ {interval}".strip()
                    except (ValueError, TypeError):
                        salary = f"{currency}{min_amt}+ {interval}".strip()

                snippet = desc[:300] + ("..." if len(desc) > 300 else "")

                matched_jobs.append({
                    "title": title,
                    "company": row_company,
                    "platform": site or "job_board",
                    "location": loc,
                    "salary": salary,
                    "datePosted": date_posted,
                    "jobUrl": job_url,
                    "descriptionSnippet": snippet
                })

        return JobSearchResponse(
            success=True,
            company_name=company_name,
            total_found=len(matched_jobs),
            jobs=matched_jobs
        )

    except Exception as e:
        return JobSearchResponse(
            success=False,
            company_name=company_name,
            total_found=0,
            jobs=[],
            error=f"JobSpy scraping failed: {str(e)}"
        )


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
