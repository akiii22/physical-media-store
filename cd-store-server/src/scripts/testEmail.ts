
import { supabase } from "../config/supabase";

const bucket = "payment-qr";

const files = ["bpi-qr.jpg", "gotyme-qr.jpg"];

async function testPaymentQr() {
  for (const file of files) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(file);

    if (error || !data) {
      console.error(`❌ Failed to download ${file}:`, error?.message);
      continue;
    }

    console.log(`✅ Successfully accessed ${file}`);
    console.log(`File size: ${data.size} bytes`);
    console.log(`Content type: ${data.type}`);
  }
}

testPaymentQr().catch(console.error);
