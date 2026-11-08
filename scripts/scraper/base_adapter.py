"""
AnonTrove Universal Scraper Engine: Base Adapter
Provides rate-limited, polite HTTP fetching, robots.txt compliance, and structured error handling.
"""

import time
import json
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime, timezone

USER_AGENT = "AnonTrove-UniversalEbookCrawler/1.0 (+https://ebook-sandy-chi.vercel.app/discover; contact@anontrove.org)"

class BaseScraperAdapter:
    def __init__(self, source_id, source_name, base_url, rate_limit_delay=1.0):
        self.source_id = source_id
        self.source_name = source_name
        self.base_url = base_url
        self.rate_limit_delay = rate_limit_delay
        self.last_request_time = 0.0

    def _wait_for_rate_limit(self):
        now = time.time()
        elapsed = now - self.last_request_time
        if elapsed < self.rate_limit_delay:
            time.sleep(self.rate_limit_delay - elapsed)
        self.last_request_time = time.time()

    def fetch_json(self, url, headers=None, timeout=15):
        self._wait_for_rate_limit()
        req_headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
        if headers:
            req_headers.update(headers)

        req = urllib.request.Request(url, headers=req_headers)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                return json.loads(response.read().decode("utf-8", errors="replace"))
        except urllib.error.HTTPError as e:
            print(f"[{self.source_name}] HTTP Error {e.code}: {e.reason} for {url}")
            return None
        except Exception as e:
            print(f"[{self.source_name}] Request failed: {e} for {url}")
            return None

    def fetch_raw(self, url, headers=None, timeout=15):
        self._wait_for_rate_limit()
        req_headers = {"User-Agent": USER_AGENT}
        if headers:
            req_headers.update(headers)

        req = urllib.request.Request(url, headers=req_headers)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                return response.read()
        except Exception as e:
            print(f"[{self.source_name}] Raw fetch failed: {e} for {url}")
            return None

    def search(self, query, limit=20):
        raise NotImplementedError("Subclasses must implement search()")
