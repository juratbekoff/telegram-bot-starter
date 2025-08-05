import axios from "axios";
import * as crypto from "crypto";

export type TravelRoute = {
  type: string;
  number: string;
  departureDate: string; // Format: "DD.MM.YYYY HH:mm"
  timeOnWay: string; // Format: "HH:mm"
  originRoute: {
    depStationName: string;
    arvStationName: string;
  };
  arrivalDate: string; // Format: "DD.MM.YYYY HH:mm"
  brand: string;
  cars: any[]; // You can replace `any` with a specific `Car` type if needed
  subRoute: {
    depStationName: string;
    depStationCode: string;
    arvStationName: string;
    arvStationCode: string;
  };
  trainId: string | null;
  comment: string | null;
};

async function getStripeIds() {
  try {
    const url = "https://m.stripe.com/6";

    const headers = {
      accept: "*/*",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language":
        "uz-US,uz;q=0.9,en-US;q=0.8,en;q=0.7,ru-US;q=0.6,ru;q=0.5",
      "content-type": "text/plain;charset=UTF-8",
      cookie:
        "m=ab0ad68e-02d4-4b1a-a4e5-8affb1e99c6ba7b241; __Secure-LinkSessionPresent=true",
      origin: "https://m.stripe.network",
      referer: "https://m.stripe.network/",
      "sec-ch-ua":
        '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
    };

    const payload = crypto.randomBytes(64).toString("base64");
    const response = await axios.post(url, payload, { headers });

    // Parse the actual response from Stripe API
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    throw error;
  }
}

export async function getTravelRoutes(date: string) {
  try {
    const stripeIds = await getStripeIds();

    // Step 2: Use fresh IDs in railway API request
    const url = "https://eticket.railway.uz/api/v3/handbook/trains/list";

    const headers = {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "en",
      Connection: "keep-alive",
      "Content-Type": "application/json",
      Cookie: `_ga=GA1.1.1520265407.1754139377; __stripe_mid=${stripeIds.data.muid}; G_ENABLED_IDPS=google; XSRF-TOKEN=d8c75c08-93cd-4030-86a2-cdc1d57ff7f9; __stripe_sid=${stripeIds.data.sid}; _ga_R5LGX7P1YR=GS2.1.s1754413080$o2$g1$t1754414814$j12$l0$h0`,
      "device-type": "BROWSER",
      Host: "eticket.railway.uz",
      Origin: "https://eticket.railway.uz",
      Referer: "https://eticket.railway.uz/en/pages/trains-page",
      "Sec-Ch-Ua":
        '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"macOS"',
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
      "X-XSRF-TOKEN": "d8c75c08-93cd-4030-86a2-cdc1d57ff7f9",
    };

    const data = {
      directions: {
        forward: {
          date,
          depStationCode: "2900790",
          arvStationCode: "2900000",
        },
      },
    };

    const response = await axios.post(url, data, { headers });

    return {
      success: true,
      message: "Train directions retrieved successfully",
      data: response.data?.data?.directions?.forward?.trains as TravelRoute[],
    };
  } catch (error) {
    throw error;
  }
}
