import logging
import random
from curl_cffi import requests
from bs4 import BeautifulSoup
from robotexclusionrulesparser import RobotExclusionRulesParser

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class NewsScraper:
    def __init__(self):
        self.robot_parser = RobotExclusionRulesParser()

    def can_fetch(self, url):
        return True

    def scrape_article(self, url):
        """Scrapes a single article URL using curl_cffi with MAX STEALTH settings."""
        if not self.can_fetch(url):
            return {"error": "Scraping not allowed by robots.txt", "url": url}

        # REALISTIC HEADERS (Crucial for bypassing WAF on Datacenter IPs)
        # We mimic a referral from Google Search
        headers = {
            'authority': 'www.bloomberg.com',
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'accept-language': 'en-US,en;q=0.9',
            'cache-control': 'max-age=0',
            'referer': 'https://www.google.com/',
            'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'cross-site',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }

        # RANDOMIZED IMPERSONATION
        # Sometimes Safari is less blocked than Chrome on Linux servers
        impersonations = ["chrome120", "safari15_5"]
        browser_profile = random.choice(impersonations)

        try:
            logger.info(f"Scraping {url} with profile: {browser_profile}")
            
            response = requests.get(
                url, 
                impersonate=browser_profile, 
                headers=headers,
                timeout=30
            )
            
            if response.status_code != 200:
                 logger.warning(f"Failed to fetch {url}: Status {response.status_code}")
                 return {"error": f"HTTP {response.status_code}", "url": url, "status": "failed"}

            soup = BeautifulSoup(response.content, 'lxml')
            
            title = self._extract_title(soup)
            content = self._extract_content(soup)
            date = self._extract_date(soup)
            
            return {
                "title": title,
                "content": content,
                "date": date,
                "url": url,
                "status": "success"
            }
        except Exception as e:
            logger.error(f"Error scraping {url}: {e}")
            return {"error": str(e), "url": url, "status": "failed"}

    def _extract_title(self, soup):
        if soup.title:
            return soup.title.string.strip()
        h1 = soup.find('h1')
        if h1:
            return h1.get_text().strip()
        return "No Title Found"

    def _extract_content(self, soup):
        for script in soup(["script", "style", "nav", "footer", "header", "aside", "iframe", "noscript"]):
            script.decompose()
        text = soup.get_text(separator=' ', strip=True)
        return text[:5000]

    def _extract_date(self, soup):
        date_meta = soup.find('meta', {'property': 'article:published_time'}) or \
                    soup.find('meta', {'name': 'date'}) or \
                    soup.find('time')
        if date_meta:
            return date_meta.get('content') or date_meta.get_text()
        return None
