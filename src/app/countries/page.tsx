import Link from "next/link";

const countries = ["Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei Darussalam","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia","Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica","Côte d’Ivoire","Croatia","Cuba","Cyprus","Czechia","Democratic People's Republic of Korea","Democratic Republic of the Congo","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Macedonia","Norway","Oman","Pakistan","Palau","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Republic of Korea","Republic of Moldova","Romania","Russian Federation","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syrian Arab Republic","Tajikistan","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Türkiye","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United Republic of Tanzania","United States","Uruguay","Uzbekistan","Vanuatu","Venezuela","Viet Nam","Yemen","Zambia","Zimbabwe","Holy See","State of Palestine"];

// ISO 3166-1 alpha-2 codes are converted to their corresponding flag emoji.
const countryCodes: Record<string, string> = {
  "Afghanistan":"AF","Albania":"AL","Algeria":"DZ","Andorra":"AD","Angola":"AO","Antigua and Barbuda":"AG","Argentina":"AR","Armenia":"AM","Australia":"AU","Austria":"AT","Azerbaijan":"AZ","Bahamas":"BS","Bahrain":"BH","Bangladesh":"BD","Barbados":"BB","Belarus":"BY","Belgium":"BE","Belize":"BZ","Benin":"BJ","Bhutan":"BT","Bolivia":"BO","Bosnia and Herzegovina":"BA","Botswana":"BW","Brazil":"BR","Brunei Darussalam":"BN","Bulgaria":"BG","Burkina Faso":"BF","Burundi":"BI","Cabo Verde":"CV","Cambodia":"KH","Cameroon":"CM","Canada":"CA","Central African Republic":"CF","Chad":"TD","Chile":"CL","China":"CN","Colombia":"CO","Comoros":"KM","Congo":"CG","Costa Rica":"CR","Côte d’Ivoire":"CI","Croatia":"HR","Cuba":"CU","Cyprus":"CY","Czechia":"CZ","Democratic People's Republic of Korea":"KP","Democratic Republic of the Congo":"CD","Denmark":"DK","Djibouti":"DJ","Dominica":"DM","Dominican Republic":"DO","Ecuador":"EC","Egypt":"EG","El Salvador":"SV","Equatorial Guinea":"GQ","Eritrea":"ER","Estonia":"EE","Eswatini":"SZ","Ethiopia":"ET","Fiji":"FJ","Finland":"FI","France":"FR","Gabon":"GA","Gambia":"GM","Georgia":"GE","Germany":"DE","Ghana":"GH","Greece":"GR","Grenada":"GD","Guatemala":"GT","Guinea":"GN","Guinea-Bissau":"GW","Guyana":"GY","Haiti":"HT","Honduras":"HN","Hungary":"HU","Iceland":"IS","India":"IN","Indonesia":"ID","Iran":"IR","Iraq":"IQ","Ireland":"IE","Israel":"IL","Italy":"IT","Jamaica":"JM","Japan":"JP","Jordan":"JO","Kazakhstan":"KZ","Kenya":"KE","Kiribati":"KI","Kuwait":"KW","Kyrgyzstan":"KG","Laos":"LA","Latvia":"LV","Lebanon":"LB","Lesotho":"LS","Liberia":"LR","Libya":"LY","Liechtenstein":"LI","Lithuania":"LT","Luxembourg":"LU","Madagascar":"MG","Malawi":"MW","Malaysia":"MY","Maldives":"MV","Mali":"ML","Malta":"MT","Marshall Islands":"MH","Mauritania":"MR","Mauritius":"MU","Mexico":"MX","Micronesia":"FM","Monaco":"MC","Mongolia":"MN","Montenegro":"ME","Morocco":"MA","Mozambique":"MZ","Myanmar":"MM","Namibia":"NA","Nauru":"NR","Nepal":"NP","Netherlands":"NL","New Zealand":"NZ","Nicaragua":"NI","Niger":"NE","Nigeria":"NG","North Macedonia":"MK","Norway":"NO","Oman":"OM","Pakistan":"PK","Palau":"PW","Panama":"PA","Papua New Guinea":"PG","Paraguay":"PY","Peru":"PE","Philippines":"PH","Poland":"PL","Portugal":"PT","Qatar":"QA","Republic of Korea":"KR","Republic of Moldova":"MD","Romania":"RO","Russian Federation":"RU","Rwanda":"RW","Saint Kitts and Nevis":"KN","Saint Lucia":"LC","Saint Vincent and the Grenadines":"VC","Samoa":"WS","San Marino":"SM","Sao Tome and Principe":"ST","Saudi Arabia":"SA","Senegal":"SN","Serbia":"RS","Seychelles":"SC","Sierra Leone":"SL","Singapore":"SG","Slovakia":"SK","Slovenia":"SI","Solomon Islands":"SB","Somalia":"SO","South Africa":"ZA","South Sudan":"SS","Spain":"ES","Sri Lanka":"LK","Sudan":"SD","Suriname":"SR","Sweden":"SE","Switzerland":"CH","Syrian Arab Republic":"SY","Tajikistan":"TJ","Thailand":"TH","Timor-Leste":"TL","Togo":"TG","Tonga":"TO","Trinidad and Tobago":"TT","Tunisia":"TN","Türkiye":"TR","Turkmenistan":"TM","Tuvalu":"TV","Uganda":"UG","Ukraine":"UA","United Arab Emirates":"AE","United Kingdom":"GB","United Republic of Tanzania":"TZ","United States":"US","Uruguay":"UY","Uzbekistan":"UZ","Vanuatu":"VU","Venezuela":"VE","Viet Nam":"VN","Yemen":"YE","Zambia":"ZM","Zimbabwe":"ZW","Holy See":"VA","State of Palestine":"PS"
};

function flagEmoji(country: string) {
  const code = countryCodes[country];
  if (!code) return "🌍";
  return String.fromCodePoint(...[...code].map((letter) => 127397 + letter.charCodeAt(0)));
}

export default function Countries() {
  return (
    <main className="portal">
      <header><Link href="/">← 200 Billion Trees</Link><Link href="/trees">Tree catalogue</Link><Link href="/donate">Donate</Link></header>
      <section className="portal-hero">
        <p className="kicker">Global directory</p>
        <h1>Countries &amp; territories</h1>
        <p>Browse the initial directory of 193 UN Member States and the two UN non-member observer States, the Holy See and State of Palestine. Listing a place does not imply participation, endorsement or a verified project.</p>
        <strong>{countries.length} directory entries</strong>
      </section>
      <section className="country-directory">
        {countries.map((country, i) => (
          <article key={country}>
            <span>{String(i + 1).padStart(3, "0")}</span>
            <strong className="country-name"><span className="country-flag" role="img" aria-label={`${country} flag`}>{flagEmoji(country)}</span>{country}</strong>
            <small>Profile planned · no verified report yet</small>
          </article>
        ))}
      </section>
      <section className="portal-note">Planting guidance must be checked against local native-species data, ecosystem, soil, rainfall, regulations, invasive-species lists and qualified local ecological advice. <Link href="/trees">View tree suitability principles →</Link></section>
    </main>
  );
}
