# 🪙 Crypto Email Alert API (Serverless on AWS)

A serverless API that allows users to get real-time cryptocurrency price alerts via email. Built using AWS Lambda, API Gateway, DynamoDB, SQS, and SES — fully managed with AWS SAM and written in TypeScript.

---

## 🚀 Features

- 🔐 Clean API to request crypto prices
- ⚡ Uses CoinGecko API (with caching)
- 📨 Sends price emails via SQS + SES
- 💾 Search history stored in DynamoDB
- 🧠 Optimized for production (CI/CD, caching, error handling)
- 🌐 Deployed via GitHub Actions with `staging` and `prod` environments

---

## 🧪 Try the Live Demo (Hosted on AWS)

You can test this project using the live URL deployed to AWS:

```
Base URL: https://r704vaq58l.execute-api.ap-southeast-2.amazonaws.com/Prod
```

> 🔐 **Important:** This system uses Amazon SES in **sandbox mode**, which means:
> - Only **verified email addresses** can receive emails
> - You must **contact the project owner first** so your email can be verified

---

#### ✅ Step-by-Step: Request Crypto Price Email

1. **Contact me** via email: `dhianpratama.m@gmail.com`  
   👉 Include the email address you plan to test with.

2. **Once you're verified**, make a POST request:

```bash
curl -X POST https://r704vaq58l.execute-api.ap-southeast-2.amazonaws.com/Prod/crypto-price \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-verified-email@example.com",
    "crypto": "bitcoin"
  }'
```

✅ If successful, you'll receive:

```json
{
  "message": "Price request received. You will get an email shortly."
}
```

3. Within a few seconds, you should receive an email with the latest price of the crypto you requested.

---

#### 🔍 View Search History

Once you've submitted a few requests, you can view your history:

```bash
curl https://r704vaq58l.execute-api.ap-southeast-2.amazonaws.com/Prod/search-history?email=your-verified-email@example.com
```

Optional query parameters:

| Parameter | Example             | Description                         |
|-----------|---------------------|-------------------------------------|
| `email`   | your@example.com    | Filter results by email             |
| `limit`   | 10                  | Max number of results to return     |
| `sort`    | asc / desc          | Sort by timestamp                   |
| `startKey`| (encoded string)    | For pagination                      |


## 🧭 Architecture Overview

This project is built on a scalable, event-driven architecture using AWS Lambda, SQS, and DynamoDB. Below are detailed flow explanations for the two core processes:

---

### 📤 1. Crypto Price Request Flow (`/crypto-price` API)

This flow handles user requests to receive crypto price updates via email. It is intentionally designed to be fast, decoupled, and resilient.

#### 📋 Flow Summary

1. **User hits `/crypto-price`** with email and crypto ID.
2. **API Gateway** triggers the `GetPriceAndQueueEmail Lambda`.
3. The Lambda:
   - Validates input
   - Generates a unique ID + timestamp
   - Saves the search request to **DynamoDB (search history)** — without the price
   - Sends a message to **SQS (CryptoEmailQueue)** with `email`, `crypto`, `id`, `timestamp`
4. **SQS** invokes the `SendEmailFromQueue Lambda`.
5. The Email Lambda:
   - Tries to find the price in **DynamoDB (price cache)**
   - If not found, fetches it from **CoinGecko**
   - Saves the price to the cache
   - Updates the original search record with the price
   - Sends the final email via **SES**

#### Benefits

- **Fast user response** with minimal processing
- **Resilient queue-based delivery** decouples pricing logic
- **Caching** minimizes external API pressure
- **Audit trail**: search and price history are stored

[View flowchart in Mermaid Live Editor](https://mermaid.live/edit#pako:eNqFUV1vmzAU_StXftjLSFe-kpSHTSnQqNI0tWKZtJE8uHATrAYbGdM2i_LfZ2zasWXSeDE-95zje889kkKUSCKy3YvnoqJSwddkzUF_i3zVooSKqRY-FPLQKDFpJCtwA5PJR7jOF3e3sKQKn-lhYyXXphLnS1R3PXPBy_sOO0xryvbwmdYPJdVUS267h52kTTXgEfxTZbn9F7v5N7pnpX4R0Bi-A9vWZkTy9OMcZU9arW4TeA-K1dgqWjdjmp9n9AmhRSqLCpSA5MBpLRI9AXABds4RP8gz5CVop5busBdk9xk8M1UBK52hD8f2Neg0_3XU2Obi2sOzh2-P4I0UGCDJtXMEsXE0EZgwbOipacOgN1LUpvLfXM8lvwdL3TyusHiEghbVeOLUO5plAOO29uk0Kvr5DSod3FY7QiwYX2qP8R7SwAashizP_cN81ZhdDjuQWAhZ2kj_jj-d2vjt2p8YhSzNzmNObUY25tQbwD5u-I6tRcMx-kVY0K4iDf6khPY6JQ7ZSVaSSMkOHVKj1G3oKzn2xDVRFda4JpH-Lal8XJM1P2lNQ_kPIepXmRTdriLRlu5bfevM7AmjelX1Gyr1MChj0XFFIs81HiQ6khcSuWF4cRV4_tyfu-Gl500dciCRBv1ZcDVzg5nve4E7PTnkp3n08mI-C0-_AC2DJ9w)

---

### 2. Scheduled Price Cache Warmer (`FetchCryptoPricesFunction`)

This background Lambda ensures that frequently requested coin prices are available in the cache, improving responsiveness and reducing reliance on live fetches.

#### Flow Summary

1. Triggered every 5 minutes via **CloudWatch Events** (schedule).
2. The function:
   - Loads a list of default popular coin IDs (e.g., `bitcoin`, `ethereum`, etc.)
   - Scans the cache table for any additional coins users have searched
   - Merges both lists into a unique set
   - Calls **CoinGecko API** in bulk to get fresh prices
   - Writes updated prices to **DynamoDB (price cache)**

#### Benefits

- Keeps top coin prices **always fresh**
- Improves **cache hit rate** for incoming requests
- Reduces CoinGecko API usage during spikes
- Adapts to trending coins based on user behavior

[View flowchart in Mermaid Live Editor](https://mermaid.live/edit#pako:eNp1Uk1v2zAM_SuErnMNfyWOfRiwxOgwoAM2dKfZOcgWYwuxJEOWtnpB_vsUqy2yw3ihSPE9PVK8kE4xJCU5jep3N1Bt4EfVSHD2qX7uBmR2RAZG875HDRj2YQD4C_UCGxBcHuHh4SPs60c03XDQy2TUN807nB-t7AxX8thITzfbttd0GuCJipbREv4L8fU328f1k6IMGJ6oHQ10iksY-WyOdzVJ_d3e9OCLu-Cyh4463YDSicb5vjKtD0q0XOI74QdgfO6U68c1ubJ_qf6BZL4zmFaFcNJKwMHVfcburKBdoLXj-R6wqZ-N0gh2YtQ40legY64WSYWq9l7fKwYlexvQ3o8y9i7xLvUu827TSBKQXnNGSqMtBkSgFvQWksuNpSFmQIENKd2RUX1uSCOvDjNR-VMp8QbTyvYDKU90nF3ktVacug8S71nttKE-KCsNKdMoTVcWUl7ICymTNAnTXZQV0TbOiywpsoAspNxGYV5Excblkm2SF8U1IH_Wd-Mwyottnu2yXZwVRb7LA4KMu1l99Qu47uH1Lw3Fy84)

---

## 📦 Project Structure

```
├── services/
│   ├── getPriceAndQueueEmail/
│   ├── getSearchHistory/
│   ├── sendEmailFromQueue/
│   └── fetchCryptoPrices/         # Scheduled fetcher to warm cache
├── shared/
│   ├── coingecko.ts
│   ├── config.ts
│   ├── dynamo.ts
│   ├── sqs.ts
│   ├── email.ts
│   └── errors.ts
├── scripts/
│   └── init-local-dynamo.ts       # Seed and init local DynamoDB
├── events/
│   └── *.json                     # Local test events
├── template.yaml
├── samconfig.toml
└── README.md
```

---

## ⚙️ Local Development

### ✅ Prerequisites

- Node.js 18+
- Docker (for `sam local`)
- AWS CLI
- SAM CLI
- DynamoDB local (via Docker)

### 🏗 Setup

```bash
npm install
npm run build
npm run init-local          # Sets up local DynamoDB tables
```

### 🧪 Test Locally

```bash
sam local invoke GetPriceAndQueueEmailFunction --event events/priceRequest.json --env-vars env.json
```

---

## 🛠 Environment Variables

Set via `template.yaml` and/or `env.json`.

| Variable           | Description                        |
|--------------------|------------------------------------|
| `SEARCH_HISTORY_TABLE`       | Search history table               |
| `PRICE_CACHE_TABLE`| Price cache table name             |
| `QUEUE_URL`        | SQS queue URL                      |
| `DYNAMO_ENDPOINT`  | DynamoDB local endpoint            |
| `SES_SENDER`       | Verified SES sender email address  |
| `IS_LOCAL`         | `"true"` for local testing         |

---

## 🚚 Deployment

### ✅ GitHub Actions CI/CD

- Push to `staging` → deploys to staging stack
- Push to `main` → deploys to production stack

Secrets are scoped per [GitHub Environment](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment).

### 🔧 Manual Deploy

```bash
sam deploy --config-env staging
sam deploy --config-env prod
```

---

## 🧪 Git Hooks & Linting

Using Husky + lint-staged:

- `prettier` and `eslint --fix` run on commit
- Run manually:

```bash
npm run pretty
npm run lint
```

---

## 📬 SES Configuration (Sandbox)

Ensure all sender/recipient emails are **verified** in [SES Sandbox](https://docs.aws.amazon.com/ses/latest/dg/sandbox.html) unless you've requested production access.

---

## 📚 API Endpoints

| Method | Path            | Description                          |
|--------|------------------|--------------------------------------|
| POST   | `/crypto-price`  | Queue a price alert email            |
| GET    | `/search-history`| Retrieve search history (with filters) |

---

## 📈 Future Improvements

- Add user auth and rate limiting
- Add `source` in the email content to let user know whether the price comes from cache or live

---

## 🧑‍💻 Maintainer

**Dhian Pratama**  
[LinkedIn](https://linkedin.com/dhianpratama) | [GitHub](https://github.com/dhianpratama) | [Email](mailto:dhianpratama.m@gmail.com)

---

