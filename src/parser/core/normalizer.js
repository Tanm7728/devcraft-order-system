export function normalizeText(text) {
  if (typeof text !== "string") {
    return "";
  }

  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[!?.,;:()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}