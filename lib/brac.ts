import type { BracStaff } from "@/types";

const PORTAL_URL = "https://hrportal.brac.net/profile/StaffInfoIndividual.aspx";

function extractHidden(html: string, name: string): string | null {
  const re = new RegExp(
    `<input[^>]*name="${name}"[^>]*value="([^"]*)"`,
    "i"
  );
  const m = html.match(re);
  return m ? m[1].replace(/&amp;/g, "&") : null;
}

function extractSpan(html: string, id: string): string {
  const re = new RegExp(
    `<span[^>]*id="${id}"[^>]*>([\\s\\S]*?)</span>`,
    "i"
  );
  const m = html.match(re);
  if (!m) return "";
  return m[1].replace(/<[^>]+>/g, "").trim();
}

export async function fetchStaffInfo(pin: string): Promise<BracStaff | null> {
  if (!pin || !/^\d+$/.test(pin.trim())) {
    throw new Error("PIN must be numeric.");
  }

  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

  try {
    const getRes = await fetch(PORTAL_URL, {
      headers: { "User-Agent": userAgent },
      cache: "no-store"
    });
    if (!getRes.ok) {
      throw new Error(`Failed to load BRAC portal (HTTP ${getRes.status}).`);
    }
    const html = await getRes.text();
    const viewstate = extractHidden(html, "__VIEWSTATE") ?? "";
    const viewstateGen = extractHidden(html, "__VIEWSTATEGENERATOR") ?? "";
    const eventValidation = extractHidden(html, "__EVENTVALIDATION") ?? "";

    const body = new URLSearchParams({
      __VIEWSTATE: viewstate,
      __VIEWSTATEGENERATOR: viewstateGen,
      __EVENTVALIDATION: eventValidation,
      ctl00$ContentPlaceHolder1$txtPIN: pin.trim(),
      ctl00$ContentPlaceHolder1$btnSearch: "Search"
    });

    const postRes = await fetch(PORTAL_URL, {
      method: "POST",
      headers: {
        "User-Agent": userAgent,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: body.toString(),
      cache: "no-store"
    });
    if (!postRes.ok) {
      throw new Error(`Search failed (HTTP ${postRes.status}).`);
    }

    const resultHtml = await postRes.text();
    const fullName = extractSpan(resultHtml, "lblFullName");
    const designation = extractSpan(resultHtml, "lblDesignation");
    const project = extractSpan(resultHtml, "lblProgram");
    const contact = extractSpan(resultHtml, "lblContact");
    const email = extractSpan(resultHtml, "lblEmail");

    if (!fullName) return null;

    return {
      pin: pin.trim(),
      fullName,
      designation,
      project,
      contact,
      email
    };
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error("BRAC portal lookup failed.");
  }
}
