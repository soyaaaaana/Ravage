//@ts-check

(async () => {
  const fs = require("fs");
  const path = require("path");

  // Discord IncのIPは使われていない気がする
  /** @type {{ syncToken: string, creationTime: string, prefixes: [{ ipv4Prefix: string, service: string, scope: string }] | [{ ipv6Prefix: string, service: string, scope: string }] }} */
  const json = await fetch("https://www.gstatic.com/ipranges/cloud.json").then(r => r.json());
  const ipv4 = json.prefixes.map(prefix => "ipv4Prefix" in prefix ? prefix.ipv4Prefix : "").filter(prefix => Boolean(prefix));
  const ipv6 = json.prefixes.map(prefix => "ipv6Prefix" in prefix ? prefix.ipv6Prefix : "").filter(prefix => Boolean(prefix));

  fs.writeFileSync(path.join(__dirname, "allowed_cidrs.json"), JSON.stringify({
    ipv4: ipv4 ? ipv4 : undefined,
    ipv6: ipv6 ? ipv6 : undefined
  }));
})()