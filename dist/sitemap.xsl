<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <title>RealSalePro XML Sitemap | Real Estate Sales CRM</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style type="text/css">
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #f4faf6;
            background: #04120c;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 960px;
            margin: 0 auto;
          }
          header {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          h1 {
            font-size: 28px;
            margin: 0 0 10px;
            color: #00E576;
          }
          p {
            font-size: 14px;
            color: #94a3b8;
            margin: 0;
            line-height: 1.5;
          }
          .badge {
            display: inline-block;
            background: rgba(0, 229, 118, 0.15);
            color: #00E576;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 700;
            margin-bottom: 14px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.08);
          }
          th {
            background: rgba(255, 255, 255, 0.06);
            color: #ffffff;
            text-align: left;
            padding: 14px 18px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          td {
            padding: 14px 18px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 13.5px;
          }
          tr:hover td {
            background: rgba(0, 229, 118, 0.04);
          }
          a {
            color: #00E576;
            text-decoration: none;
            font-weight: 600;
          }
          a:hover {
            text-decoration: underline;
          }
          .priority {
            font-weight: 700;
            color: #38bdf8;
          }
          .freq {
            color: #94a3b8;
            text-transform: capitalize;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <span class="badge">Google SEO XML Sitemap</span>
            <h1>RealSalePro XML Sitemap</h1>
            <p>This sitemap is generated dynamically for Google, Bing, and other search engine crawlers. It indexes all public landing pages, solutions, tools, and pricing plans.</p>
          </header>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>URL</th>
                <th>Priority</th>
                <th>Change Frequency</th>
                <th>Last Modified</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td style="color: #64748b;"><xsl:value-of select="position()"/></td>
                  <td>
                    <a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a>
                  </td>
                  <td class="priority"><xsl:value-of select="sitemap:priority"/></td>
                  <td class="freq"><xsl:value-of select="sitemap:changefreq"/></td>
                  <td style="color: #94a3b8;"><xsl:value-of select="sitemap:lastmod"/></td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
