/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** https://www.barcodelookup.com/api — optional paid key for broader UPC coverage */
  readonly VITE_BARCODE_LOOKUP_API_KEY?: string;
  /** https://fdc.nal.usda.gov/api-key-signup — optional; defaults to DEMO_KEY (strict rate limits) */
  readonly VITE_USDA_FDC_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
