// The name the API gives a downloaded Offer sheet, from its answer's
// `Content-Disposition`, which the API exposes to the dashboard's origin
// (sheet ticket 01): its `filename*`, percent-encoded as UTF-8 (RFC 8187),
// which keeps a Kurdish or an Arabic name, else its plain `filename`, the
// name in English, else none.
export function fileNameIn(contentDisposition: string | null): string | undefined {
  if (contentDisposition === null) return undefined;
  const encoded = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(contentDisposition)?.[1];
  if (encoded !== undefined) {
    try {
      return decodeURIComponent(encoded.trim());
    } catch {
      // A name that is not UTF-8 well encoded falls back to the plain one.
    }
  }
  return /filename\s*=\s*"([^"]*)"/i.exec(contentDisposition)?.[1];
}

// Saves a file the browser was given under its name, as a link with
// `download` does, so that a phone puts it among its downloaded files.
export function saveTheFile(file: Blob, name: string): void {
  const address = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = address;
  link.download = name;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  // The browser has read the file once the click is handled.
  setTimeout(() => URL.revokeObjectURL(address), 60_000);
}
