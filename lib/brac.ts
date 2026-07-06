import type { BracStaff } from "@/types";

const PORTAL_URL = "https://hrportal.brac.net/profile/StaffInfoIndividual.aspx";

function extractHidden(html: string, name: string): string {
  const re = new RegExp(`name="${name}"[^>]*value="([^"]*)"`, "i");
  const m = html.match(re);
  return m ? m[1].replace(/&amp;/g, "&") : "";
}

function extractSpan(html: string, id: string): string {
  const re = new RegExp(`id="${id}"[^>]*>([\\s\\S]*?)<\\/span>`, "i");
  const m = html.match(re);
  if (!m) return "";
  return m[1]
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .trim();
}

export async function fetchStaffInfo(pin: string): Promise<BracStaff | null> {
  if (!pin || !/^\d+$/.test(pin.trim())) {
    throw new Error("PIN must be numeric.");
  }

  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

  try {
    // 1. GET the form to grab ViewState
    const getRes = await fetch(PORTAL_URL, {
      headers: { "User-Agent": userAgent },
      cache: "no-store"
    });
    if (!getRes.ok) {
      throw new Error(`Failed to load BRAC portal (HTTP ${getRes.status}).`);
    }
    const formHtml = await getRes.text();

    const viewstate = extractHidden(formHtml, "__VIEWSTATE");
    const viewstateGen = extractHidden(formHtml, "__VIEWSTATEGENERATOR");
    const eventValidation = extractHidden(formHtml, "__EVENTVALIDATION");

    // 2. POST the PIN
    const body = new URLSearchParams({
      __VIEWSTATE: viewstate,
      __VIEWSTATEGENERATOR: viewstateGen || "CF9D09A0",
      __EVENTVALIDATION: eventValidation,
      txtPIN: pin.trim(),
      btnHidLoad: "Button"
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

    // Detect "Invalid PIN" message
    if (/id="lbl_InvalidPIN"/i.test(resultHtml)) {
      return null;
    }

    // Extract staff info using the labels the portal actually emits
    const name = extractSpan(resultHtml, "lbl_Name");
    const designation = extractSpan(resultHtml, "lbl_Des");
    const project = extractSpan(resultHtml, "lbl_Project");
    const contact = extractSpan(resultHtml, "lbl_Contact");
    const email = extractSpan(resultHtml, "lbl_Email");

    if (!name) return null;

    return {
      pin: pin.trim(),
      fullName: name,
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
