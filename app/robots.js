export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/dashboard", "/api", "/sign-in", "/sign-up", "/claim"],
      },
    ],
    sitemap: "https://www.epinvesting.com/sitemap.xml",
  };
}
