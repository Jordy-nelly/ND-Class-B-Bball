const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Load the Excel files
const districtPath = path.join(__dirname, '..', 'District Assignments Over Time FINAL.xlsx');
const mascotPath = path.join(__dirname, '..', 'Mascots(2012 Names).csv');
const coopMascotPath = path.join(__dirname, '..', 'Coop Mascot List(End).csv');
const basketballCoopsPath = path.join(__dirname, '..', 'data', 'basketball-coops.json');

const workbook = XLSX.readFile(districtPath);

// Load basketball co-ops data (from scraper)
let basketballCoops = { allCoops: [] };
try {
  if (fs.existsSync(basketballCoopsPath)) {
    basketballCoops = JSON.parse(fs.readFileSync(basketballCoopsPath, 'utf-8'));
    console.log(`[CoopData] Loaded ${basketballCoops.allCoops?.length || 0} basketball co-ops from scraper data`);
  }
} catch (error) {
  console.warn('[CoopData] Could not load basketball-coops.json:', error.message);
}

// Manual overrides for historical schools not in CSVs
const manualMascotOverrides = {
  // Historical schools that closed/merged before 2012
  'alexander': { mascot: 'Comets', city: 'Alexander' },
  'almont': { mascot: 'Coyotes', city: 'Almont' },
  'antler': { mascot: 'Antlers', city: 'Antler' },
  'arnegard': { mascot: 'Wildcats', city: 'Arnegard' },
  'bantry': { mascot: 'Bears', city: 'Bantry' },
  'barton': { mascot: 'Beavers', city: 'Barton' },
  'balfour': { mascot: 'Bears', city: 'Balfour' },
  'bergen': { mascot: 'Bulldogs', city: 'Bergen' },
  'binford': { mascot: 'Vikings', city: 'Binford' },
  'brocket': { mascot: 'Braves', city: 'Brocket' },
  'buelah': { mascot: 'Miners', city: 'Beulah' }, // typo variant
  'butte': { mascot: 'Bulldogs', city: 'Butte' },
  'campbell-tintah': { mascot: 'Titans', city: 'Campbell' },
  'columbus': { mascot: 'Cardinals', city: 'Columbus' },
  'crary': { mascot: 'Crusaders', city: 'Crary' },
  'dawson': { mascot: 'Dragons', city: 'Dawson' },
  'dazey': { mascot: 'Devils', city: 'Dazey' },
  'deering': { mascot: 'Demons', city: 'Deering' },
  'dodge': { mascot: 'Mustangs', city: 'Dodge' },
  'douglas': { mascot: 'Patriots', city: 'Douglas' },
  'egeland': { mascot: 'Eagles', city: 'Egeland' },
  'esmond': { mascot: 'Eagles', city: 'Esmond' },
  'fairdale': { mascot: 'Falcons', city: 'Fairdale' },
  'gackle': { mascot: 'Gorillas', city: 'Gackle' },
  'gackle-streeter': { mascot: 'Gorillas', city: 'Gackle' },
  'galesburg': { mascot: 'Giants', city: 'Galesburg' },
  'gilby': { mascot: 'Giants', city: 'Gilby' },
  'goodrich': { mascot: 'Gophers', city: 'Goodrich' },
  'grace city': { mascot: 'Grovers', city: 'Grace City' },
  'hannaford': { mascot: 'Hawks', city: 'Hannaford' },
  'havana': { mascot: 'Hawks', city: 'Havana' },
  'heimdal': { mascot: 'Hawks', city: 'Heimdal' },
  'hurdsfield': { mascot: 'Hurricanes', city: 'Hurdsfield' },
  'jud': { mascot: 'Jets', city: 'Jud' },
  'knox': { mascot: 'Knights', city: 'Knox' },
  'kramer': { mascot: 'Kings', city: 'Kramer' },
  'lansford': { mascot: 'Lions', city: 'Lansford' },
  'lehr': { mascot: 'Lions', city: 'Lehr' },
  'litchville': { mascot: 'Lions', city: 'Litchville' },
  'litchville-marion': { mascot: 'Cardinals', city: 'Litchville' },
  'mchenry': { mascot: 'Mustangs', city: 'McHenry' },
  'mcville': { mascot: 'Mavericks', city: 'McVille' },
  'mercer': { mascot: 'Mustangs', city: 'Mercer' },
  'michigan': { mascot: 'Lakers', city: 'Michigan' },
  'minot ryan': { mascot: 'Lions', city: 'Minot' }, // variant
  'neche': { mascot: 'Cardinals', city: 'Neche' },
  'new hradec': { mascot: 'Hawks', city: 'New Hradec' },
  'north central': { mascot: 'Bison', city: 'Rogers' },
  'orrin': { mascot: 'Orioles', city: 'Orrin' },
  'osnabrock': { mascot: 'Owls', city: 'Osnabrock' },
  'page': { mascot: 'Panthers', city: 'Page' },
  'palermo': { mascot: 'Panthers', city: 'Palermo' },
  'pembina': { mascot: 'Panthers', city: 'Pembina' },
  'pembina-neche': { mascot: 'Panthers', city: 'Pembina' },
  'pettibone': { mascot: 'Patriots', city: 'Pettibone' },
  'pisek': { mascot: 'Panthers', city: 'Pisek' },
  'portal': { mascot: 'Panthers', city: 'Portal' },
  'raub': { mascot: 'Raiders', city: 'Raub' },
  'reeder': { mascot: 'Rams', city: 'Reeder' },
  'regan': { mascot: 'Raiders', city: 'Regan' },
  'sharon': { mascot: 'Sharks', city: 'Sharon' },
  'sheyenne': { mascot: 'Mustangs', city: 'Sheyenne' },
  'spring brook': { mascot: 'Spartans', city: 'Spring Brook' },
  'starkweather': { mascot: 'Storm', city: 'Starkweather' },
  'sterling': { mascot: 'Jets', city: 'Sterling' },
  'streeter': { mascot: 'Stallions', city: 'Streeter' },
  'sykeston': { mascot: 'Saints', city: 'Sykeston' },
  'tappen': { mascot: 'Comets', city: 'Tappen' },
  'tolna': { mascot: 'Trojans', city: 'Tolna' },
  'tuttle': { mascot: 'Tigers', city: 'Tuttle' },
  'tuttle-pettibone': { mascot: 'Titans', city: 'Tuttle' },
  'upham': { mascot: 'Vikings', city: 'Upham' },
  'valley': { mascot: 'Vikings', city: 'Hoople' },
  'valley-edinburg': { mascot: 'Vikings', city: 'Hoople' },
  'venturia': { mascot: 'Vikings', city: 'Venturia' },
  'voltaire': { mascot: 'Vikings', city: 'Voltaire' },
  'walcott': { mascot: 'Warriors', city: 'Walcott' },
  'wildrose': { mascot: 'Wildcats', city: 'Wildrose' },
  'wildrose-alamo': { mascot: 'Wildcats', city: 'Wildrose' },
  'wimbledon': { mascot: 'Wolves', city: 'Wimbledon' },
  'wimbledon-courtenay': { mascot: 'Wolves', city: 'Wimbledon' },
  'wolford': { mascot: 'Warriors', city: 'Wolford' },
  'york': { mascot: 'Yankees', city: 'York' },
  'zeeland': { mascot: 'Clippers', city: 'Zeeland' },
  'zap': { mascot: 'Zappers', city: 'Zap' },
  // Common typos from source data
  'surrey': { mascot: 'Mustangs', city: 'Surrey' },
  'glenburn': { mascot: 'Panthers', city: 'Glenburn' },
  'lakota': { mascot: 'Raiders', city: 'Lakota' },
  'beach': { mascot: 'Buccaneers', city: 'Beach' },
  'belfield': { mascot: 'Bantams', city: 'Belfield' },
  'cando': { mascot: 'Bearcats', city: 'Cando' },
  'cavalier': { mascot: 'Tornadoes', city: 'Cavalier' },
  'fessenden': { mascot: 'Orioles', city: 'Fessenden' },
  'fessenden-bowdon': { mascot: 'Orioles', city: 'Fessenden' },
  'harvey': { mascot: 'Hornets', city: 'Harvey' },
  'max': { mascot: 'Cossacks', city: 'Max' },
  'colony': { mascot: 'Colonels', city: 'Colony' },
  'border central': { mascot: 'Mustangs', city: 'Langdon' },
  'cannonball': { mascot: 'Chiefs', city: 'Cannonball' },
  'elgin-new leipzig': { mascot: 'Eagles', city: 'Elgin' },
  'elgin': { mascot: 'Eagles', city: 'Elgin' },
  'new leipzig': { mascot: 'Tigers', city: 'New Leipzig' },
  'carson': { mascot: 'Cougars', city: 'Carson' },
  
  // Additional typos and historical schools from unknown list
  'adams-lankin': { mascot: 'Spartans', city: 'Edmore' },
  'alsen': { mascot: 'Aces', city: 'Alsen' },
  'amenia': { mascot: 'Bulldogs', city: 'Amenia' },
  'aneta': { mascot: 'Vikings', city: 'Aneta' },
  'argusville': { mascot: 'Eagles', city: 'Argusville' },
  'arthur': { mascot: 'Eagles', city: 'Arthur' },
  'arthur dakota': { mascot: 'Eagles', city: 'Arthur' },
  'ashely': { mascot: 'Aces', city: 'Ashley' }, // typo for Ashley
  'ayr': { mascot: 'Falcons', city: 'Ayr' },
  'balta': { mascot: 'Bears', city: 'Balta' },
  'belcourt': { mascot: 'Braves', city: 'Belcourt' },
  'berhold-carpio': { mascot: 'Bombers', city: 'Berthold' }, // typo
  'berhtold': { mascot: 'Bombers', city: 'Berthold' }, // typo
  'berthod': { mascot: 'Bombers', city: 'Berthold' }, // typo
  'bindord': { mascot: 'Vikings', city: 'Binford' }, // typo
  'bisebee': { mascot: 'Wildcats', city: 'Bisbee' }, // typo
  'bobbineau': { mascot: 'Braves', city: 'Bottineau' }, // typo
  'bodwon': { mascot: 'Orioles', city: 'Bowdon' }, // typo
  'boeauttin': { mascot: 'Braves', city: 'Bottineau' }, // typo
  'border aces': { mascot: 'Aces', city: 'Langdon' },
  'border aces (border centra/rock lake)': { mascot: 'Aces', city: 'Langdon' },
  'border cetnral': { mascot: 'Mustangs', city: 'Langdon' }, // typo
  'bottinuea': { mascot: 'Braves', city: 'Bottineau' }, // typo
  'bowdonw': { mascot: 'Orioles', city: 'Bowdon' }, // typo
  'bowdown': { mascot: 'Orioles', city: 'Bowdon' }, // typo
  'bowdon': { mascot: 'Orioles', city: 'Bowdon' },
  'buchanana': { mascot: 'Rebels', city: 'Buchanan' }, // typo
  'buchanan': { mascot: 'Rebels', city: 'Buchanan' },
  'buffalo': { mascot: 'Bison', city: 'Buffalo' },
  'buffalo-tower city': { mascot: 'Bison', city: 'Buffalo' },
  'burke centarl': { mascot: 'Titans', city: 'Lignite' }, // typo
  'burke central': { mascot: 'Titans', city: 'Lignite' },
  'burke county (bowbells/burke )': { mascot: 'Titans', city: 'Lignite' },
  'burke cout': { mascot: 'Titans', city: 'Lignite' }, // typo
  'buxton': { mascot: 'Valiants', city: 'Buxton' },
  'buxton central valley': { mascot: 'Valiants', city: 'Buxton' },
  'central valley': { mascot: 'Valiants', city: 'Buxton' },
  'cathay': { mascot: 'Cardinals', city: 'Cathay' },
  'calvin': { mascot: 'Cougars', city: 'Calvin' },
  'cardinal muench': { mascot: 'Cardinals', city: 'Fargo' },
  'cardinal-muench': { mascot: 'Cardinals', city: 'Fargo' },
  'carington': { mascot: 'Cardinals', city: 'Carrington' }, // typo
  'carringtring': { mascot: 'Cardinals', city: 'Carrington' }, // typo
  'carpio': { mascot: 'Cougars', city: 'Carpio' },
  'cass valley north': { mascot: 'Vikings', city: 'Argusville' },
  'cass valley north (argusville)': { mascot: 'Vikings', city: 'Argusville' },
  'casselton': { mascot: 'Squirrels', city: 'Casselton' },
  'chaffee': { mascot: 'Falcons', city: 'Chaffee' },
  'chruchs ferry': { mascot: 'Sailors', city: 'Churchs Ferry' }, // typo
  'churchs ferry': { mascot: 'Sailors', city: 'Churchs Ferry' },
  'cleveland': { mascot: 'Clippers', city: 'Cleveland' },
  'colfax': { mascot: 'Colts', city: 'Colfax' },
  'colfax (richmond)': { mascot: 'Colts', city: 'Colfax' },
  'cooperstown': { mascot: 'Cougars', city: 'Cooperstown' },
  'courteney': { mascot: 'Wolves', city: 'Courtenay' }, // typo
  'courtenay': { mascot: 'Wolves', city: 'Courtenay' },
  'deslacs': { mascot: 'Lakers', city: 'Des Lacs' }, // typo
  'des-lacs-burlington': { mascot: 'Lakers', city: 'Des Lacs' },
  'driscoll': { mascot: 'Dragons', city: 'Driscoll' },
  'discoll': { mascot: 'Dragons', city: 'Driscoll' }, // typo
  "devil's lake st. mary's": { mascot: 'Saints', city: 'Devils Lake' },
  'dakota': { mascot: 'Knights', city: 'Arthur' },
  'dakota (arthur)': { mascot: 'Knights', city: 'Arthur' },
  'dakota/cass valley north': { mascot: 'Knights', city: 'Arthur' },
  'dickey': { mascot: 'Devils', city: 'Dickey' },
  'dickey central': { mascot: 'Devils', city: 'Dickey' },
  'dickey central (monago)': { mascot: 'Devils', city: 'Monango' },
  'divide coutn': { mascot: 'Maroons', city: 'Crosby' }, // typo
  'donnybrook': { mascot: 'Dragons', city: 'Donnybrook' },
  'drake-anamoose': { mascot: 'Raiders', city: 'Drake' },
  'dulm': { mascot: 'Gophers', city: 'Kulm' }, // typo
  'eckelson': { mascot: 'Eagles', city: 'Eckelson' },
  'edgely': { mascot: 'Rangers', city: 'Edgeley' }, // typo
  'emmons central': { mascot: 'Clippers', city: 'Strasburg' },
  'emore': { mascot: 'Spartans', city: 'Edmore' }, // typo
  'epping': { mascot: 'Eagles', city: 'Epping' },
  'erie': { mascot: 'Eagles', city: 'Erie' },
  'finely': { mascot: 'Raiders', city: 'Finley' }, // typo
  'fingal': { mascot: 'Falcons', city: 'Fingal' },
  'flaxton': { mascot: 'Falcons', city: 'Flaxton' },
  'forbes': { mascot: 'Falcons', city: 'Forbes' },
  'fort toten': { mascot: 'Indians', city: 'Fort Totten' }, // typo
  'fort totten': { mascot: 'Indians', city: 'Fort Totten' },
  'fort yate public': { mascot: 'Warriors', city: 'Fort Yates' }, // typo
  'fort yates': { mascot: 'Warriors', city: 'Fort Yates' },
  'fort yates public': { mascot: 'Warriors', city: 'Fort Yates' },
  'four s': { mascot: 'Indians', city: 'Fort Totten' }, // typo
  'ft. totten': { mascot: 'Indians', city: 'Fort Totten' },
  'ft. yates (srchs)': { mascot: 'Warriors', city: 'Fort Yates' },
  'fullerton': { mascot: 'Falcons', city: 'Fullerton' },
  'grandin': { mascot: 'Giants', city: 'Grandin' },
  'glenfield': { mascot: 'Mustangs', city: 'Glenfield' },
  'glenfield-sutton': { mascot: 'Mustangs', city: 'Glenfield' },
  'golva': { mascot: 'Cowboys', city: 'Golva' },
  'griggs coutny central': { mascot: 'Cougars', city: 'Cooperstown' }, // typo
  'grigs county central': { mascot: 'Cougars', city: 'Cooperstown' }, // typo
  'guelph': { mascot: 'Giants', city: 'Guelph' },
  'gwinner': { mascot: 'Bulldogs', city: 'Gwinner' },
  'h-m-b': { mascot: 'Tigers', city: 'Hazelton' }, // Hazelton-Moffit-Braddock
  'hacen': { mascot: 'Bison', city: 'Hazen' }, // typo
  'hague': { mascot: 'Hawks', city: 'Hague' },
  'hampden': { mascot: 'Hawks', city: 'Hampden' },
  'hannah': { mascot: 'Hawks', city: 'Hannah' },
  'hauge': { mascot: 'Hawks', city: 'Hague' }, // typo
  'hazelton-moffiit-braddock': { mascot: 'Tigers', city: 'Hazelton' }, // typo
  'helton-moffit': { mascot: 'Tigers', city: 'Hazelton' }, // typo
  'hempden': { mascot: 'Hawks', city: 'Hampden' }, // typo
  'hoople': { mascot: 'Vikings', city: 'Hoople' },
  'hunter': { mascot: 'Jaguars', city: 'Hunter' },
  'hzelton-moffit': { mascot: 'Tigers', city: 'Hazelton' }, // typo
  'hzen': { mascot: 'Bison', city: 'Hazen' }, // typo
  'karlsruhe': { mascot: 'Knights', city: 'Karlsruhe' },
  'karsruhe': { mascot: 'Knights', city: 'Karlsruhe' }, // typo
  'kathryn': { mascot: 'Knights', city: 'Kathryn' },
  'kloten': { mascot: 'Knights', city: 'Kloten' },
  'lefor': { mascot: 'Lions', city: 'Lefor' },
  'leonard': { mascot: 'Lions', city: 'Leonard' },
  'lewis & clark': { mascot: 'Pioneers', city: 'Berthold' },
  'lignite': { mascot: 'Titans', city: 'Lignite' },
  'lignite (burke county)': { mascot: 'Titans', city: 'Lignite' },
  'lindgerwood': { mascot: 'Cardinals', city: 'Lidgerwood' }, // typo
  'lingerwood': { mascot: 'Cardinals', city: 'Lidgerwood' }, // typo
  'luverne': { mascot: 'Lions', city: 'Luverne' },
  'mls (mohall-landford/sherwood)': { mascot: 'Mavericks', city: 'Mohall' },
  'mls (mohall-sherwood)': { mascot: 'Mavericks', city: 'Mohall' },
  'makota': { mascot: 'Mustangs', city: 'Makoti' }, // typo
  'makoti': { mascot: 'Wildcats', city: 'Makoti' },
  'mapleton': { mascot: 'Mustangs', city: 'Mapleton' },
  'marion': { mascot: 'Cardinals', city: 'Marion' },
  'marion-montpelier': { mascot: 'Cardinals', city: 'Marion' },
  'may-port cg': { mascot: 'Patriots', city: 'Mayville' },
  'mayville-portland cg': { mascot: 'Patriots', city: 'Mayville' },
  'mcgregor': { mascot: 'Mustangs', city: 'McGregor' },
  'meinda': { mascot: 'Mustangs', city: 'Medina' }, // typo
  'medina': { mascot: 'Mustangs', city: 'Medina' },
  'midaway': { mascot: 'Monarchs', city: 'Inkster' }, // typo
  'milton': { mascot: 'Mustangs', city: 'Milton' },
  'mindway/minto': { mascot: 'Mustangs', city: 'Inkster' }, // typo
  'minto': { mascot: 'Mustangs', city: 'Minto' },
  'monago': { mascot: 'Mustangs', city: 'Monango' }, // typo
  'monango': { mascot: 'Mustangs', city: 'Monango' },
  'montepelier': { mascot: 'Vikings', city: 'Montpelier' }, // typo
  'montepelior': { mascot: 'Vikings', city: 'Montpelier' }, // typo
  'montpelier': { mascot: 'Vikings', city: 'Montpelier' },
  'montpelior': { mascot: 'Vikings', city: 'Montpelier' }, // typo
  'munihc': { mascot: 'Cardinals', city: 'Munich' }, // typo
  'munich': { mascot: 'Cardinals', city: 'Munich' },
  'ndsd': { mascot: 'Firebirds', city: 'Devils Lake' }, // ND School for the Deaf
  'nekoma': { mascot: 'Nighthawks', city: 'Nekoma' },
  'nelson county north': { mascot: 'Chargers', city: 'Lakota' },
  'new englad': { mascot: 'Tigers', city: 'New England' }, // typo
  'new englad/regent': { mascot: 'Tigers', city: 'New England' }, // typo
  'new engladn/regent': { mascot: 'Tigers', city: 'New England' }, // typo
  'new enland': { mascot: 'Tigers', city: 'New England' }, // typo
  'new enland/regent': { mascot: 'Tigers', city: 'New England' }, // typo
  'newengland/regent': { mascot: 'Tigers', city: 'New England' }, // typo
  'new rockford st. james': { mascot: 'Saints', city: 'New Rockford' },
  'new salme': { mascot: 'Holsteins', city: 'New Salem' }, // typo
  'noonan': { mascot: 'Nighthawks', city: 'Noonan' },
  'north sargetn': { mascot: 'Bulldogs', city: 'Gwinner' }, // typo
  'north wood': { mascot: 'Thunder', city: 'Northwood' }, // typo
  'northwood': { mascot: 'Thunder', city: 'Northwood' },
  'northshore/plaza': { mascot: 'Wildcats', city: 'Makoti' },
  'nroth shore/plaza': { mascot: 'Wildcats', city: 'Makoti' }, // typo
  'north shore': { mascot: 'Wildcats', city: 'Makoti' },
  'north shore/plaza': { mascot: 'Wildcats', city: 'Makoti' },
  'north shore/white shield': { mascot: 'Wildcats', city: 'Makoti' },
  'oberon': { mascot: 'Owls', city: 'Oberon' },
  'oriska': { mascot: 'Owls', city: 'Oriska' },
  'osnbrock': { mascot: 'Owls', city: 'Osnabrock' }, // typo
  'our redeemers': { mascot: 'Knights', city: 'Minot' },
  "our redeemer's": { mascot: 'Knights', city: 'Minot' },
  'p-b-k': { mascot: 'Rebels', city: 'Kensal' }, // Pingree-Buchanan-Kensal
  'pillsbury': { mascot: 'Panthers', city: 'Pillsbury' },
  'pilsbury': { mascot: 'Panthers', city: 'Pillsbury' }, // typo
  'palmero': { mascot: 'Panthers', city: 'Palermo' }, // typo
  'petersburg': { mascot: 'Knights', city: 'Petersburg' },
  'plaza': { mascot: 'Pioneers', city: 'Plaza' },
  "raleigh st. gertrude's": { mascot: 'Saints', city: 'Raleigh' },
  'raleigh st. gertrudes': { mascot: 'Saints', city: 'Raleigh' },
  'raleigh st. gertrudge': { mascot: 'Saints', city: 'Raleigh' }, // typo
  'raleight st. gertrugde': { mascot: 'Saints', city: 'Raleigh' }, // typo
  'riverdale': { mascot: 'Raiders', city: 'Riverdale' },
  'robinson': { mascot: 'Rockets', city: 'Robinson' },
  'robinson-woodworth': { mascot: 'Rockets', city: 'Robinson' },
  'rock late': { mascot: 'Wildcats', city: 'Rock Lake' }, // typo
  'rock lake': { mascot: 'Wildcats', city: 'Rock Lake' },
  'rola': { mascot: 'Bulldogs', city: 'Rolla' }, // typo
  'rolal': { mascot: 'Bulldogs', city: 'Rolla' }, // typo
  'rolla': { mascot: 'Bulldogs', city: 'Rolla' },
  'rollete': { mascot: 'Comets', city: 'Rolette' }, // typo
  'rolette': { mascot: 'Comets', city: 'Rolette' },
  'srchs (fort yates)': { mascot: 'Warriors', city: 'Fort Yates' },
  'sanborn': { mascot: 'Spartans', city: 'Sanborn' },
  'sawer': { mascot: 'Spartans', city: 'Sawyer' }, // typo
  'sawyer': { mascot: 'Spartans', city: 'Sawyer' },
  'sheldon': { mascot: 'Spartans', city: 'Sheldon' },
  'sheldon/chaffee': { mascot: 'Spartans', city: 'Sheldon' },
  'sherood': { mascot: 'Mavericks', city: 'Sherwood' }, // typo
  'sheroowd': { mascot: 'Mavericks', city: 'Sherwood' }, // typo
  'sherwood': { mascot: 'Mavericks', city: 'Sherwood' },
  'sheynne': { mascot: 'Mustangs', city: 'Sheyenne' }, // typo
  'shiloh-christian': { mascot: 'Skyhawks', city: 'Bismarck' },
  'soen': { mascot: 'Eagles', city: 'Solen' }, // typo
  'solen': { mascot: 'Eagles', city: 'Solen' },
  'souris': { mascot: 'Sioux', city: 'Souris' },
  "st. gertrude's": { mascot: 'Saints', city: 'Raleigh' },
  "st. gertrude's (raleigh)": { mascot: 'Saints', city: 'Raleigh' },
  "st. gertrudes's": { mascot: 'Saints', city: 'Raleigh' }, // typo
  'st. thomasw': { mascot: 'Spoilers', city: 'St. Thomas' }, // typo
  'st. thomas': { mascot: 'Spoilers', city: 'St. Thomas' },
  'st.thomas': { mascot: 'Spoilers', city: 'St. Thomas' },
  'standingrock/selfridge': { mascot: 'Warriors', city: 'Fort Yates' },
  'strasburg central emmons': { mascot: 'Clippers', city: 'Strasburg' },
  'strasburg emmons': { mascot: 'Clippers', city: 'Strasburg' },
  'strasburg emmons central': { mascot: 'Clippers', city: 'Strasburg' },
  'strasuburg': { mascot: 'Clippers', city: 'Strasburg' }, // typo
  'strausburg': { mascot: 'Clippers', city: 'Strasburg' }, // typo
  'strasburg': { mascot: 'Clippers', city: 'Strasburg' },
  'streel': { mascot: 'Pirates', city: 'Steele' }, // typo
  'steele': { mascot: 'Pirates', city: 'Steele' },
  'tgu (granville)': { mascot: 'Titans', city: 'Towner' },
  'tgu (towner/granville)': { mascot: 'Titans', city: 'Towner' },
  'tgu (towner/willow city)': { mascot: 'Titans', city: 'Towner' },
  'tgu-wc (towner/granville-willow city)': { mascot: 'Titans', city: 'Towner' },
  'tolley': { mascot: 'Tigers', city: 'Tolley' },
  'tower city': { mascot: 'Raiders', city: 'Tower City' },
  'unity': { mascot: 'Vikings', city: 'Petersburg' },
  'unity of petersburg': { mascot: 'Vikings', city: 'Petersburg' },
  'verona': { mascot: 'Vikings', city: 'Verona' },
  'watfordcity': { mascot: 'Wolves', city: 'Watford City' }, // typo
  'westhope-souris': { mascot: 'Sioux', city: 'Westhope' },
  'wheatland': { mascot: 'Warriors', city: 'Wheatland' },
  'while shield': { mascot: 'Warriors', city: 'Roseglen' }, // typo
  'white shield': { mascot: 'Warriors', city: 'Roseglen' },
  'willow city': { mascot: 'Wildcats', city: 'Willow City' },
  'willow wity': { mascot: 'Wildcats', city: 'Willow City' }, // typo
  'wilrdose-alamo': { mascot: 'Wildcats', city: 'Wildrose' }, // typo
  'wilrose-alamo': { mascot: 'Wildcats', city: 'Wildrose' }, // typo
  'woodworth': { mascot: 'Warriors', city: 'Woodworth' },
  'wyndemere': { mascot: 'Warriors', city: 'Wyndmere' }, // typo
};

// Normalize school name for matching (lowercase, trim, standardize)
function normalizeSchoolName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')  // normalize whitespace
    .replace(/['']/g, "'"); // normalize apostrophes
}

// City coordinates for North Dakota (manually collected common cities)
const cityCoordinates = {
  // Major cities
  'Fargo': { lat: 46.8772, lng: -96.7898 },
  'Bismarck': { lat: 46.8083, lng: -100.7837 },
  'Grand Forks': { lat: 47.9253, lng: -97.0329 },
  'Minot': { lat: 48.2325, lng: -101.2963 },
  'Dickinson': { lat: 46.8792, lng: -102.7896 },
  'Williston': { lat: 48.1470, lng: -103.6180 },
  'Jamestown': { lat: 46.9106, lng: -98.7084 },
  'Mandan': { lat: 46.8267, lng: -100.8890 },
  
  // District 1 cities
  'Fairmount': { lat: 46.0541, lng: -96.6048 },
  'Hankinson': { lat: 46.0736, lng: -96.8987 },
  'Lisbon': { lat: 46.4383, lng: -97.6837 },
  'Milnor': { lat: 46.2611, lng: -97.4548 },
  'Gwinner': { lat: 46.2255, lng: -97.6606 },
  'Oakes': { lat: 46.1386, lng: -98.0913 },
  'Forman': { lat: 46.1072, lng: -97.6373 },
  'Wyndmere': { lat: 46.2647, lng: -97.1181 },
  'Lidgerwood': { lat: 46.0736, lng: -97.1556 },
  
  // District 2 cities
  'Casselton': { lat: 46.9003, lng: -97.2117 },
  'Enderlin': { lat: 46.6247, lng: -97.5998 },
  'Finley': { lat: 47.5142, lng: -97.8359 },
  'Kindred': { lat: 46.6500, lng: -97.0167 },
  'Tower City': { lat: 46.9261, lng: -97.6706 },
  'Hunter': { lat: 47.1872, lng: -97.2145 },
  'Colfax': { lat: 46.4742, lng: -96.8809 },
  'Hope': { lat: 47.3222, lng: -97.7184 },
  
  // District 3 cities
  'Buxton': { lat: 47.6225, lng: -97.0934 },
  'Petersburg': { lat: 48.0094, lng: -98.0023 },
  'Cooperstown': { lat: 47.4444, lng: -98.1237 },
  'Northwood': { lat: 47.7386, lng: -97.5728 },
  'Hillsboro': { lat: 47.4042, lng: -97.0620 },
  'Larimore': { lat: 47.9067, lng: -97.6273 },
  'Mayville': { lat: 47.4981, lng: -97.3245 },
  'Thompson': { lat: 47.7736, lng: -97.1098 },
  
  // District 4 cities
  'Cavalier': { lat: 48.7939, lng: -97.6223 },
  'Drayton': { lat: 48.5672, lng: -97.1773 },
  'Grafton': { lat: 48.4125, lng: -97.4106 },
  'Inkster': { lat: 48.1542, lng: -97.6437 },
  'Walhalla': { lat: 48.9244, lng: -97.9184 },
  'Park River': { lat: 48.3983, lng: -97.7437 },
  'Hoople': { lat: 48.5386, lng: -97.6334 },
  'Edinburg': { lat: 48.4933, lng: -97.9320 },
  'Fordville': { lat: 48.2281, lng: -97.7962 },
  
  // District 5 cities
  'Rogers': { lat: 47.0908, lng: -98.1373 },
  'Gackle': { lat: 46.6219, lng: -99.1423 },
  'Edgeley': { lat: 46.3611, lng: -98.7173 },
  'Ellendale': { lat: 46.0022, lng: -98.5273 },
  'LaMoure': { lat: 46.3611, lng: -98.2923 },
  'Marion': { lat: 46.5650, lng: -98.3467 },
  'Kensal': { lat: 47.2717, lng: -98.7548 },
  'Valley City': { lat: 46.9233, lng: -98.0031 },
  
  // District 6 cities
  'Steele': { lat: 46.8550, lng: -99.9173 },
  'Linton': { lat: 46.2664, lng: -100.2334 },
  'Napoleon': { lat: 46.5083, lng: -99.7712 },
  'Wishek': { lat: 46.2564, lng: -99.5562 },
  'Ashley': { lat: 46.0344, lng: -99.3712 },
  'Strasburg': { lat: 46.1347, lng: -100.1612 },
  'Zeeland': { lat: 46.0811, lng: -99.8123 },
  'Hazelton': { lat: 46.4833, lng: -100.2789 },
  'Tappen': { lat: 46.8694, lng: -99.6256 },
  
  // District 7 cities
  'Carrington': { lat: 47.4497, lng: -99.1262 },
  'Fort Totten': { lat: 47.9689, lng: -99.0112 },
  'Harvey': { lat: 47.7697, lng: -99.9351 },
  'Lakota': { lat: 48.0428, lng: -98.3398 },
  'Glenfield': { lat: 47.4536, lng: -98.5606 },
  'New Rockford': { lat: 47.6797, lng: -99.1384 },
  'Warwick': { lat: 47.8489, lng: -98.7131 },
  'Fessenden': { lat: 47.6492, lng: -99.6295 },
  'Maddock': { lat: 47.9586, lng: -99.5295 },
  
  // District 8 cities
  'Leeds': { lat: 48.2864, lng: -99.4376 },
  'Langdon': { lat: 48.7606, lng: -98.3687 },
  'Munich': { lat: 48.6658, lng: -98.8445 },
  'Cando': { lat: 48.4864, lng: -99.2098 },
  'Rolette': { lat: 48.6611, lng: -99.8412 },
  'Rolla': { lat: 48.8578, lng: -99.6181 },
  'St. John': { lat: 48.9453, lng: -99.7459 },
  'Rock Lake': { lat: 48.8306, lng: -99.4473 },
  'Minnewaukan': { lat: 48.0697, lng: -99.2520 },
  'Bisbee': { lat: 48.6244, lng: -99.3748 },
  
  // District 9 cities
  'Center': { lat: 47.1164, lng: -101.2998 },
  'Elgin': { lat: 46.4011, lng: -101.8462 },
  'Carson': { lat: 46.4164, lng: -101.5609 },
  'Flasher': { lat: 46.4533, lng: -101.2298 },
  'New Salem': { lat: 46.8444, lng: -101.4134 },
  'Almont': { lat: 46.7197, lng: -101.5012 },
  'Solen': { lat: 46.3839, lng: -100.7962 },
  'Fort Yates': { lat: 46.0872, lng: -100.6298 },
  'Selfridge': { lat: 46.0450, lng: -101.0620 },
  
  // District 10 cities
  'Garrison': { lat: 47.6528, lng: -101.4184 },
  'Max': { lat: 47.8206, lng: -101.2962 },
  'Turtle Lake': { lat: 47.5225, lng: -100.8912 },
  'Underwood': { lat: 47.4533, lng: -101.1384 },
  'Washburn': { lat: 47.2897, lng: -101.0290 },
  'Wilton': { lat: 47.1581, lng: -100.7912 },
  'Wing': { lat: 47.1422, lng: -100.0690 },
  'McClusky': { lat: 47.4864, lng: -100.4423 },
  
  // District 11 cities
  'Bottineau': { lat: 48.8272, lng: -100.4451 },
  'Drake': { lat: 47.8283, lng: -100.3712 },
  'Anamoose': { lat: 47.8833, lng: -100.2451 },
  'Dunseith': { lat: 48.8119, lng: -100.0609 },
  'Rugby': { lat: 48.3689, lng: -99.9962 },
  'Sawyer': { lat: 48.0858, lng: -101.0570 },
  'Towner': { lat: 48.3456, lng: -100.4045 },
  'Velva': { lat: 48.0567, lng: -100.9295 },
  'Westhope': { lat: 48.9133, lng: -101.0373 },
  'Newburg': { lat: 48.6917, lng: -100.9134 },
  'Granville': { lat: 48.2675, lng: -100.8384 },
  
  // District 12 cities
  'Des Lacs': { lat: 48.2253, lng: -101.5834 },
  'Glenburn': { lat: 48.4928, lng: -101.2473 },
  'Kenmare': { lat: 48.6739, lng: -102.0823 },
  'Berthold': { lat: 48.3250, lng: -101.6712 },
  'Mohall': { lat: 48.7636, lng: -101.5134 },
  'Sherwood': { lat: 48.9631, lng: -101.6237 },
  'Surrey': { lat: 48.2364, lng: -101.1348 },
  
  // District 13 cities
  'Beach': { lat: 46.9183, lng: -104.0076 },
  'Bowman': { lat: 46.1831, lng: -103.3948 },
  'Belfield': { lat: 46.8856, lng: -103.1998 },
  'South Heart': { lat: 46.8542, lng: -102.9837 },
  'Hettinger': { lat: 46.0014, lng: -102.6373 },
  'Scranton': { lat: 46.1472, lng: -102.5187 },
  'Mott': { lat: 46.3725, lng: -102.3251 },
  'Regent': { lat: 46.4264, lng: -102.5534 },
  'New England': { lat: 46.5456, lng: -102.8648 },
  'Rhame': { lat: 46.2300, lng: -103.6462 },
  
  // District 14 cities
  'Beulah': { lat: 47.2633, lng: -101.7784 },
  'Hazen': { lat: 47.2953, lng: -101.6223 },
  'Hebron': { lat: 46.9006, lng: -102.0473 },
  'Glen Ullin': { lat: 46.8153, lng: -101.8298 },
  'Killdeer': { lat: 47.3711, lng: -102.7573 },
  'Halliday': { lat: 47.3514, lng: -102.3401 },
  'Richardton': { lat: 46.8842, lng: -102.3148 },
  'Taylor': { lat: 46.8944, lng: -102.4401 },
  
  // District 15 cities
  'Makoti': { lat: 48.1692, lng: -101.8284 },
  'Mandaree': { lat: 47.7850, lng: -102.5570 },
  'New Town': { lat: 47.9797, lng: -102.4901 },
  'Parshall': { lat: 47.9547, lng: -102.1384 },
  'Stanley': { lat: 48.3178, lng: -102.3901 },
  'Watford City': { lat: 47.8025, lng: -103.2823 },
  'Alexander': { lat: 47.8428, lng: -103.6401 },
  'Roseglen': { lat: 47.8036, lng: -101.8634 },
  
  // District 16 cities
  'Bowbells': { lat: 48.8028, lng: -102.2473 },
  'Lignite': { lat: 48.8725, lng: -102.5573 },
  'Crosby': { lat: 48.9144, lng: -103.2951 },
  'Powers Lake': { lat: 48.5678, lng: -102.6276 },
  'Ray': { lat: 48.3447, lng: -103.1609 },
  'Tioga': { lat: 48.3967, lng: -102.9387 },
  'Trenton': { lat: 48.0653, lng: -103.8251 },
  'Grenora': { lat: 48.6139, lng: -103.9373 },
  
  // Additional cities from mascot list
  'Edmore': { lat: 48.4158, lng: -98.4473 },
  'Kulm': { lat: 46.3017, lng: -98.9373 },
  'Montpelier': { lat: 46.7017, lng: -98.5773 },
  'Belcourt': { lat: 48.8392, lng: -99.7459 },
  'Stanton': { lat: 47.3211, lng: -101.3812 },
  'Golden Valley': { lat: 47.2972, lng: -102.0684 },
  
  // Additional cities from basketball co-ops audit
  'Devils Lake': { lat: 48.1128, lng: -98.8651 },
  'Goodrich': { lat: 47.4736, lng: -100.1262 },
  'Hatton': { lat: 47.6381, lng: -97.4542 },
  'Lansford': { lat: 48.6278, lng: -101.3798 },
  'Medina': { lat: 46.8953, lng: -99.2962 },
  'Minto': { lat: 48.2861, lng: -97.3698 },
  'Pembina': { lat: 48.9661, lng: -97.2431 },
  'Starkweather': { lat: 48.4483, lng: -98.8845 },
  'Wolford': { lat: 48.4778, lng: -99.6762 },
  'Neche': { lat: 48.9831, lng: -97.5573 },
  'Buchanan': { lat: 46.8347, lng: -99.0423 },
  'Pingree': { lat: 47.1544, lng: -98.9298 },
  
  // Consolidated/regional school locations (use primary city)
  'Burke Central': { lat: 48.7894, lng: -102.5298 },  // Bowbells area
  'Cass Valley North': { lat: 47.0517, lng: -96.9445 },  // Argusville area (NOT Hoople!)
  'Cass Valley North (Argusville)': { lat: 47.0517, lng: -96.9445 },  // Argusville
  'Central Valley': { lat: 47.6225, lng: -97.0934 },  // Buxton area (Traill County) - co-ops with Hillsboro
  'Central Valley (Buxton)': { lat: 47.6225, lng: -97.0934 },  // Buxton
  'Buxton Central Valley': { lat: 47.6225, lng: -97.0934 },  // Buxton
  'Dakota': { lat: 47.1072, lng: -97.2145 },  // Arthur area (NOT Bismarck!)
  'Dakota (Arthur)': { lat: 47.1072, lng: -97.2145 },  // Arthur
  'Dakota Prairie': { lat: 48.0483, lng: -98.0845 },  // Petersburg area
  'Griggs County Central': { lat: 47.4444, lng: -98.1237 },  // Cooperstown
  'Midkota': { lat: 47.2717, lng: -98.7548 },  // Glenfield/Kensal area
  'Midway': { lat: 48.1542, lng: -97.6437 },  // Inkster area (Grand Forks County) - NOT Munich
  'North Central': { lat: 47.1436, lng: -98.1273 },  // Rogers area
  'North Sargent': { lat: 46.2611, lng: -97.4548 },  // Milnor area
  'North Shore': { lat: 47.9697, lng: -101.8256 },  // Makoti area (NOT Fort Totten)
  'North Star': { lat: 48.6244, lng: -99.3748 },  // Bisbee/Cando area
  'South Prairie': { lat: 46.4650, lng: -97.6548 },  // Sargent County
  'South Border': { lat: 46.0344, lng: -99.3712 },  // Ashley area
  'White Shield': { lat: 47.7950, lng: -101.8634 },  // Roseglen area
  'Standing Rock': { lat: 46.0872, lng: -100.6298 },  // Fort Yates
  'Four Winds': { lat: 47.9689, lng: -99.0112 },  // Fort Totten
  'Tintah': { lat: 46.0114, lng: -96.3987 },  // Minnesota border
  
  // Private/special schools and consolidated schools
  'St. Thomas': { lat: 48.6236, lng: -97.4512 },  // Pembina County
  'Wimbledon': { lat: 46.9953, lng: -98.4673 },  // Barnes County
  'Courtenay': { lat: 47.2311, lng: -98.4223 },  // Stutsman County
  'Wimbledon-Courtenay': { lat: 47.1131, lng: -98.4448 },  // Between the two
  "Our Redeemer's": { lat: 48.2325, lng: -101.2963 },  // Minot area
  "Our Redeemer's Christian": { lat: 48.2325, lng: -101.2963 },  // Minot area (straight apostrophe)
  'North Dakota School for the Deaf': { lat: 48.1128, lng: -98.8651 },  // Devils Lake
  
  // Historical/closed school cities - Batch 1 (A-E)
  'Alsen': { lat: 48.6294, lng: -98.7098 },
  'Amenia': { lat: 47.0214, lng: -97.2156 },
  'Aneta': { lat: 47.7186, lng: -97.9762 },
  'Antler': { lat: 48.9694, lng: -101.2823 },
  'Argusville': { lat: 47.0517, lng: -96.9445 },
  'Arthur': { lat: 47.1072, lng: -97.2145 },
  'Ayr': { lat: 47.0436, lng: -97.4762 },
  'Balfour': { lat: 47.9578, lng: -100.5384 },
  'Balta': { lat: 48.1650, lng: -100.0373 },
  'Binford': { lat: 47.5572, lng: -98.3473 },
  'Bisbee': { lat: 48.6244, lng: -99.3748 },
  'Bowdon': { lat: 47.4681, lng: -99.6795 },
  'Buffalo': { lat: 46.9194, lng: -97.5473 },
  'Butte': { lat: 47.8317, lng: -100.1098 },
  'Cathay': { lat: 47.4181, lng: -98.6312 },
  'Calvin': { lat: 48.8028, lng: -98.6012 },
  'Carpio': { lat: 48.4450, lng: -101.7151 },
  'Chaffee': { lat: 46.4008, lng: -97.0837 },
  'Cleveland': { lat: 47.0056, lng: -99.1298 },
  'Colfax': { lat: 46.4722, lng: -96.8556 },
  'Columbus': { lat: 48.9039, lng: -102.7823 },
  'Crary': { lat: 48.0497, lng: -98.5648 },
  'Deering': { lat: 48.3939, lng: -101.0634 },
  'Dickey': { lat: 46.5289, lng: -98.4612 },
  'Driscoll': { lat: 46.8433, lng: -100.1373 },
  'Dodge': { lat: 47.3042, lng: -100.0601 },
  'Donnybrook': { lat: 48.5067, lng: -101.9273 },
  'Eckelson': { lat: 46.7683, lng: -98.3173 },
  'Egeland': { lat: 48.6244, lng: -99.0848 },
  'Epping': { lat: 48.2439, lng: -103.3648 },
  'Erie': { lat: 47.1056, lng: -97.3901 },
  'Esmond': { lat: 48.0344, lng: -99.7623 },
  
  // Historical/closed school cities - Batch 2 (F-H)
  'Forbes': { lat: 46.1039, lng: -98.8198 },
  'Fredonia': { lat: 46.3483, lng: -99.1698 },
  'Fullerton': { lat: 46.1592, lng: -98.4173 },
  'Garske': { lat: 48.5244, lng: -98.6848 },
  'Gilby': { lat: 48.0736, lng: -97.4437 },
  'Gladstone': { lat: 46.8597, lng: -102.5762 },
  'Glenfield': { lat: 47.4536, lng: -98.5606 },
  'Golva': { lat: 46.7275, lng: -103.9806 },
  'Grace City': { lat: 47.5189, lng: -98.8048 },
  'Grandin': { lat: 47.2408, lng: -97.0162 },
  'Granville': { lat: 48.2675, lng: -100.8384 },
  'Hampden': { lat: 48.5364, lng: -99.4776 },
  'Hannaford': { lat: 47.3131, lng: -98.1876 },
  'Havana': { lat: 45.9506, lng: -98.0673 },
  'Haynes': { lat: 46.1269, lng: -101.4523 },
  'Hensel': { lat: 48.9697, lng: -97.6162 },
  'Hague': { lat: 46.0428, lng: -99.9912 },
  'Hurdsfield': { lat: 47.4472, lng: -99.9198 },
  
  // Historical/closed school cities - Batch 3 (J-M)
  'Jud': { lat: 46.5036, lng: -99.0948 },
  'Juanita': { lat: 47.0569, lng: -98.7598 },
  'Karlsruhe': { lat: 48.1006, lng: -100.6248 },
  'Kief': { lat: 47.9264, lng: -100.8048 },
  'Knox': { lat: 48.3136, lng: -100.2534 },
  'Kramer': { lat: 48.7011, lng: -100.7062 },
  'Lankin': { lat: 48.3003, lng: -98.0509 },
  'Lehr': { lat: 46.2583, lng: -99.3398 },
  'Leith': { lat: 46.2650, lng: -101.7323 },
  'Landa': { lat: 48.8028, lng: -99.1348 },
  'Loma': { lat: 48.8389, lng: -98.7848 },
  'Loraine': { lat: 48.0761, lng: -98.2948 },
  'Manfred': { lat: 47.8633, lng: -99.5898 },
  'Manvel': { lat: 48.0756, lng: -97.1823 },
  'Mapleton': { lat: 46.8917, lng: -97.0556 },
  'Marmarth': { lat: 46.2994, lng: -103.7451 },
  'Martin': { lat: 47.8150, lng: -97.4312 },
  'McHenry': { lat: 47.5817, lng: -98.5848 },
  'McVille': { lat: 47.7628, lng: -98.1723 },
  'Mercer': { lat: 47.5472, lng: -100.7123 },
  'Michigan': { lat: 48.0306, lng: -98.1048 },
  'Milton': { lat: 48.6256, lng: -97.9423 },
  'Monango': { lat: 46.1586, lng: -98.4762 },
  'Mooreton': { lat: 46.2669, lng: -96.8673 },
  'Mylo': { lat: 48.6278, lng: -99.6848 },
  
  // Historical/closed school cities - Batch 4 (N-R)
  'Noonan': { lat: 48.8900, lng: -103.0173 },
  'Norma': { lat: 48.1328, lng: -99.8123 },
  'Oberon': { lat: 47.9161, lng: -99.2198 },
  'Oriska': { lat: 46.9308, lng: -97.7698 },
  'Osnabrock': { lat: 48.6089, lng: -98.1398 },
  'Pekin': { lat: 47.7839, lng: -98.3798 },
  'Perth': { lat: 48.7172, lng: -99.4273 },
  'Pillsbury': { lat: 47.2283, lng: -97.8062 },
  'Plaza': { lat: 48.0294, lng: -101.9573 },
  'Portal': { lat: 48.9953, lng: -102.5473 },
  'Reile': { lat: 48.9694, lng: -98.3173 },
  'Reynolds': { lat: 47.7422, lng: -97.1098 },
  'Riga': { lat: 46.3833, lng: -98.6148 },
  'Rocklake': { lat: 48.8306, lng: -99.4473 },
  'Rock Lake': { lat: 48.8306, lng: -99.4473 },
  'Ross': { lat: 48.3094, lng: -102.5623 },
  'Ruette': { lat: 48.0150, lng: -97.1673 },
  
  // Historical/closed school cities - Batch 5 (S-Z)
  'Sanborn': { lat: 46.9386, lng: -98.1048 },
  'Sarles': { lat: 48.9425, lng: -99.0098 },
  'Sheldon': { lat: 46.5881, lng: -97.4923 },
  'Sherwood': { lat: 48.9631, lng: -101.6237 },
  'Sibley': { lat: 46.6311, lng: -97.2923 },
  'Solen': { lat: 46.3839, lng: -100.7962 },
  'Souris': { lat: 48.9161, lng: -100.0962 },
  'Spiritwood': { lat: 46.9806, lng: -98.4473 },
  'Sutton': { lat: 47.5333, lng: -98.5623 },
  'Sykeston': { lat: 47.4639, lng: -99.4098 },
  'Tolna': { lat: 47.8350, lng: -98.4398 },
  'Tokio': { lat: 48.9528, lng: -99.3898 },
  'Verona': { lat: 46.3903, lng: -98.0648 },
  'Wahpeton': { lat: 46.2650, lng: -96.6062 },
  'Wales': { lat: 48.8956, lng: -98.6048 },
  'Walcott': { lat: 46.3264, lng: -96.9362 },
  'Warwick': { lat: 47.8489, lng: -98.7131 },
  'Wheelock': { lat: 48.6417, lng: -100.7684 },
  'Wheatland': { lat: 46.9075, lng: -97.0848 },
  'White Earth': { lat: 48.4469, lng: -102.8401 },
  'Wildrose': { lat: 48.6264, lng: -103.1773 },
  'Willow City': { lat: 48.6050, lng: -100.2948 },
  'Woodworth': { lat: 47.1419, lng: -99.2698 },
  'York': { lat: 48.3094, lng: -99.5873 },
  'Zap': { lat: 47.2883, lng: -101.9312 },
  'Zeeland': { lat: 46.0811, lng: -99.8123 },
  
  // Additional missing cities - Batch 6
  'Churchs Ferry': { lat: 48.3311, lng: -99.0248 },
  'Fingal': { lat: 46.4533, lng: -97.7962 },
  'Flaxton': { lat: 48.9036, lng: -102.3898 },
  'Galesburg': { lat: 47.2258, lng: -97.3887 },
  'Guelph': { lat: 48.0539, lng: -99.3548 },
  'Hannah': { lat: 48.9728, lng: -98.7098 },
  'Kathryn': { lat: 46.6594, lng: -97.6598 },
  'Kloten': { lat: 48.7294, lng: -101.0398 },
  'Lefor': { lat: 46.7522, lng: -102.4487 },
  'Leonard': { lat: 46.6503, lng: -97.2498 },
  'Litchville': { lat: 46.6522, lng: -98.1873 },
  'Luverne': { lat: 47.2589, lng: -97.9173 },
  'McGregor': { lat: 48.5367, lng: -101.4523 },
  'Nekoma': { lat: 48.5967, lng: -98.3798 },
  'New Leipzig': { lat: 46.3728, lng: -101.9498 },
  'Orrin': { lat: 47.9778, lng: -100.4998 },
  'Palermo': { lat: 48.0533, lng: -101.9573 },
  'Pettibone': { lat: 47.1208, lng: -99.5273 },
  'Pisek': { lat: 48.2917, lng: -97.6562 },
  'Raub': { lat: 48.9056, lng: -99.5273 },
  'Regan': { lat: 46.7861, lng: -100.3798 },
  'Reeder': { lat: 46.1086, lng: -102.9448 },
  'Robinson': { lat: 47.1428, lng: -99.7623 },
  'Roseglen': { lat: 47.8017, lng: -101.8923 },
  'Sawyer': { lat: 48.0889, lng: -101.0498 },
  'Sterling': { lat: 46.8144, lng: -100.2698 },
  'Streeter': { lat: 46.6594, lng: -99.3648 },
  'Tolley': { lat: 48.7694, lng: -101.5723 },
  'Tower City': { lat: 46.9228, lng: -97.6623 },
  'Voltaire': { lat: 48.0861, lng: -100.7723 },
  'Venturia': { lat: 46.0414, lng: -99.6623 },
  'Spring Brook': { lat: 47.8839, lng: -100.3748 },
  
  // Final batch - remaining missing cities
  'Page': { lat: 47.1608, lng: -97.5623 },
  'Raleigh': { lat: 46.0633, lng: -101.2973 },
  'Riverdale': { lat: 47.4922, lng: -101.3673 },
  'Sharon': { lat: 47.5961, lng: -97.9148 },
  'Sheyenne': { lat: 47.8342, lng: -97.5173 },
  'Tuttle': { lat: 47.1453, lng: -100.0273 },
  'Upham': { lat: 48.5853, lng: -100.7348 },
};

// Parse mascot data from both CSV files
function parseMascotData() {
  const mascots = {};           // normalized name -> { mascot, city }
  const originalToNormalized = {}; // original name -> normalized name (for lookups)
  const memberToCoopMascot = {};   // individual school -> co-op mascot info (fallback)
  
  // Helper to add entry with normalization
  function addEntry(school, mascot, city) {
    if (!school || !mascot) return;
    
    const normalized = normalizeSchoolName(school);
    const original = school.trim();
    
    mascots[normalized] = { mascot: mascot.trim(), city: city?.trim() || '' };
    originalToNormalized[original] = normalized;
    
    // Parse bracket notation: "Benson County [Leeds/Maddock]"
    const bracketMatch = school.match(/^(.+?)\s*\[(.+)\]$/);
    if (bracketMatch) {
      const coopName = bracketMatch[1].trim();
      const members = bracketMatch[2].split('/').map(s => s.trim());
      
      // Add the co-op name as an alias
      const normalizedCoop = normalizeSchoolName(coopName);
      if (!mascots[normalizedCoop]) {
        mascots[normalizedCoop] = { mascot: mascot.trim(), city: city?.trim() || '' };
      }
      
      // Add each member school as a potential lookup
      members.forEach(member => {
        const normalizedMember = normalizeSchoolName(member);
        if (!memberToCoopMascot[normalizedMember]) {
          memberToCoopMascot[normalizedMember] = { mascot: mascot.trim(), city: city?.trim() || '' };
        }
      });
    }
    
    // Parse slash notation: "Bowman/Rhame/Scranton"
    if (school.includes('/') && !school.includes('[')) {
      const members = school.split('/').map(s => s.trim());
      members.forEach(member => {
        const normalizedMember = normalizeSchoolName(member);
        if (!memberToCoopMascot[normalizedMember]) {
          memberToCoopMascot[normalizedMember] = { mascot: mascot.trim(), city: city?.trim() || '' };
        }
      });
    }
    
    // Parse parentheses notation: "Grant County (Elgin-New Leipzig-Carson)"
    const parenMatch = school.match(/^(.+?)\s*\((.+)\)$/);
    if (parenMatch) {
      const coopName = parenMatch[1].trim();
      const normalizedCoop = normalizeSchoolName(coopName);
      if (!mascots[normalizedCoop]) {
        mascots[normalizedCoop] = { mascot: mascot.trim(), city: city?.trim() || '' };
      }
    }
  }
  
  // Read primary mascot file (has city data)
  const mascotFile = fs.readFileSync(mascotPath, 'utf-8');
  const mascotLines = mascotFile.split('\n');
  
  mascotLines.slice(3).forEach(line => { // Skip header rows
    const parts = line.split(',');
    if (parts.length >= 2) {
      const school = parts[0].trim();
      const mascot = parts[1].trim();
      const city = parts[2]?.trim() || '';
      if (school && mascot) {
        addEntry(school, mascot, city);
      }
    }
  });
  
  // Read coop mascot file (no city, but has additional co-op variations)
  const coopFile = fs.readFileSync(coopMascotPath, 'utf-8');
  const coopLines = coopFile.split('\n');
  
  coopLines.forEach(line => {
    const parts = line.split(',');
    if (parts.length >= 2) {
      const school = parts[0].trim();
      const mascot = parts[1].trim();
      if (school && mascot) {
        const normalized = normalizeSchoolName(school);
        // Only add if not already present (primary file takes precedence for city)
        if (!mascots[normalized]) {
          addEntry(school, mascot, '');
        } else if (!mascots[normalized].mascot && mascot) {
          // Update mascot if primary had empty mascot
          mascots[normalized].mascot = mascot;
        }
      }
    }
  });
  
  // Add manual overrides
  Object.entries(manualMascotOverrides).forEach(([school, data]) => {
    const normalized = normalizeSchoolName(school);
    if (!mascots[normalized]) {
      mascots[normalized] = data;
    }
  });
  
  return { mascots, memberToCoopMascot, originalToNormalized };
}

// Lookup mascot with multiple fallback strategies
function lookupMascot(schoolName, mascotLookup) {
  const { mascots, memberToCoopMascot } = mascotLookup;
  const normalized = normalizeSchoolName(schoolName);
  
  // 1. Exact normalized match
  if (mascots[normalized] && mascots[normalized].mascot) {
    return mascots[normalized];
  }
  
  // 2. Try primary school name (first part before /)
  const primaryName = normalizeSchoolName(schoolName.split('/')[0]);
  if (mascots[primaryName] && mascots[primaryName].mascot) {
    return mascots[primaryName];
  }
  
  // 3. Try co-op member lookup
  if (memberToCoopMascot[primaryName]) {
    return memberToCoopMascot[primaryName];
  }
  
  // 4. Try removing "co-op" suffix and bracket content
  const cleanedName = normalizeSchoolName(
    schoolName.replace(/\s*co-?op\s*/gi, '').replace(/\s*\[.*\]\s*/, '').trim()
  );
  if (mascots[cleanedName] && mascots[cleanedName].mascot) {
    return mascots[cleanedName];
  }
  
  // 5. Fuzzy: check if any mascot key contains this school name
  for (const [key, data] of Object.entries(mascots)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      if (data.mascot) return data;
    }
  }
  
  // 6. Check manual overrides directly
  const overrideData = manualMascotOverrides[normalized];
  if (overrideData) {
    return overrideData;
  }
  
  // 7. Not found
  return null;
}

// Parse all district data
function parseAllDistricts() {
  const allData = {};
  
  workbook.SheetNames.forEach((sheetName) => {
    if (!sheetName.startsWith('District')) return;
    
    const districtNum = parseInt(sheetName.replace('District ', ''));
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Filter out empty rows
    const nonEmptyRows = data.filter(row => row.some(cell => cell !== undefined && cell !== ''));
    
    // Skip header row
    const yearRows = nonEmptyRows.slice(1);
    
    const districtData = {};
    yearRows.forEach(row => {
      const year = row[0];
      if (typeof year !== 'number') return;
      
      // Get all teams for this year (columns 1-N)
      const teams = row.slice(1)
        .filter(cell => cell && typeof cell === 'string' && cell.trim() !== '')
        .map(cell => cell.trim().replace(',', '')); // Clean up commas
      
      if (teams.length > 0) {
        districtData[year] = teams;
      }
    });
    
    if (Object.keys(districtData).length > 0) {
      allData[districtNum] = districtData;
    }
  });
  
  return allData;
}

// Get unique school names across all districts and years
function getUniqueSchools(districtData) {
  const schools = new Set();
  
  Object.values(districtData).forEach(district => {
    Object.values(district).forEach(yearTeams => {
      yearTeams.forEach(team => schools.add(team));
    });
  });
  
  return Array.from(schools).sort();
}

// Match school to city coordinates
function getSchoolCoordinates(schoolName, mascotLookup) {
  const result = lookupMascot(schoolName, mascotLookup);
  
  // FIRST: Try direct match of school name to city coordinates
  // This ensures schools like "Hebron" get Hebron's coords, not their co-op partner's
  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (schoolName.toLowerCase() === city.toLowerCase()) {
      return { ...coords, city };
    }
  }
  
  // Try matching primary school name (before any slash) to city coordinates
  const primaryName = schoolName.split('/')[0].split('-')[0].trim();
  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (primaryName.toLowerCase() === city.toLowerCase()) {
      return { ...coords, city };
    }
  }
  
  // Try exact city match from mascot lookup
  if (result && result.city) {
    if (cityCoordinates[result.city]) {
      return { ...cityCoordinates[result.city], city: result.city };
    }
    // Try case-insensitive city match
    for (const [city, coords] of Object.entries(cityCoordinates)) {
      if (city.toLowerCase() === result.city.toLowerCase()) {
        return { ...coords, city };
      }
    }
  }
  
  // Try matching by city name contained in school name
  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (schoolName.toLowerCase().includes(city.toLowerCase())) {
      return { ...coords, city };
    }
  }
  
  // Return null with city from mascot lookup if available
  if (result && result.city) {
    return { lat: 0, lng: 0, city: result.city, missingCoords: true };
  }
  
  return null;
}

/**
 * Build co-op history for a school
 * Searches the basketball co-ops data for any co-ops that include this school
 * @param {string} schoolName - Name of the school
 * @returns {Array} - Array of co-op relationships
 */
function buildCoopHistoryForSchool(schoolName) {
  const coopHistory = [];
  const normalizedSchoolName = schoolName.toLowerCase().trim();
  
  for (const coop of basketballCoops.allCoops || []) {
    // Check if this school is in the component schools
    const isComponent = (coop.componentSchools || []).some(comp => {
      const normalizedComp = comp.toLowerCase().trim();
      return normalizedComp === normalizedSchoolName ||
             normalizedSchoolName.includes(normalizedComp) ||
             normalizedComp.includes(normalizedSchoolName);
    });
    
    if (isComponent) {
      // Get year range from co-op data
      const years = coop.yearsActive || [];
      
      coopHistory.push({
        coopName: coop.coopName || coop.name,
        schools: coop.componentSchools || [],
        yearsActive: years,
        sport: coop.sport || 'basketball',
        gender: coop.gender || 'boys',
      });
    }
  }
  
  return coopHistory;
}

// Main execution
const mascotLookup = parseMascotData();
const districtData = parseAllDistricts();
const uniqueSchools = getUniqueSchools(districtData);

console.log('=== DISTRICT SUMMARY ===');
Object.entries(districtData).forEach(([district, years]) => {
  const yearList = Object.keys(years).sort();
  const minYear = Math.min(...yearList.map(Number));
  const maxYear = Math.max(...yearList.map(Number));
  console.log(`District ${district}: ${yearList.length} years (${minYear}-${maxYear})`);
});

console.log(`\n=== UNIQUE SCHOOLS: ${uniqueSchools.length} ===`);

// Build coordinates and mascot data
const schoolCoords = {};
const missingCoords = [];
const mascotStats = {
  matched: [],
  unknown: [],
  missingCity: []
};

uniqueSchools.forEach(school => {
  const coords = getSchoolCoordinates(school, mascotLookup);
  const mascotResult = lookupMascot(school, mascotLookup);
  
  if (coords && !coords.missingCoords) {
    schoolCoords[school] = coords;
  } else if (coords && coords.missingCoords) {
    schoolCoords[school] = { lat: 0, lng: 0, city: coords.city };
    missingCoords.push({ school, city: coords.city });
  } else {
    // No coordinates, but still add with placeholder
    schoolCoords[school] = { lat: 0, lng: 0, city: '' };
    missingCoords.push({ school, city: '' });
  }
  
  // Track mascot matching stats
  if (mascotResult && mascotResult.mascot && mascotResult.mascot !== 'Unknown') {
    mascotStats.matched.push(school);
    if (!mascotResult.city) {
      mascotStats.missingCity.push(school);
    }
  } else {
    mascotStats.unknown.push(school);
  }
});

console.log(`\nSchools with coordinates: ${uniqueSchools.length - missingCoords.length}`);
console.log(`Schools missing coordinates: ${missingCoords.length}`);

if (missingCoords.length > 0) {
  console.log('\n=== MISSING COORDINATES ===');
  missingCoords.slice(0, 20).forEach(({ school, city }) => {
    console.log(`  - ${school}${city ? ` (city: ${city})` : ''}`);
  });
  if (missingCoords.length > 20) {
    console.log(`  ... and ${missingCoords.length - 20} more`);
  }
}

// Co-op history summary
const schoolsWithCoopHistory = uniqueSchools.filter(school => buildCoopHistoryForSchool(school).length > 0);
console.log('\n=== CO-OP HISTORY SUMMARY ===');
console.log(`Schools with co-op history: ${schoolsWithCoopHistory.length}/${uniqueSchools.length}`);
if (schoolsWithCoopHistory.length > 0 && schoolsWithCoopHistory.length <= 20) {
  schoolsWithCoopHistory.forEach(school => {
    const history = buildCoopHistoryForSchool(school);
    console.log(`  - ${school}: ${history.length} co-op(s)`);
  });
}

// Validation summary
console.log('\n=== MASCOT MATCHING SUMMARY ===');
console.log(`✅ Mascots matched: ${mascotStats.matched.length}/${uniqueSchools.length}`);
console.log(`❌ Mascots unknown: ${mascotStats.unknown.length}/${uniqueSchools.length}`);
console.log(`⚠️  Missing city data: ${mascotStats.missingCity.length}/${uniqueSchools.length}`);

if (mascotStats.unknown.length > 0) {
  console.log('\n=== SCHOOLS WITH UNKNOWN MASCOTS ===');
  mascotStats.unknown.forEach(school => {
    console.log(`  - ${school}`);
  });
}

// Generate TypeScript data file
const tsOutput = `// Auto-generated district data from Excel
// Generated on ${new Date().toISOString()}

export interface CoopInfo {
  coopName: string;
  schools: string[];
  yearsActive: number[];
  sport: string;
  gender: string;
}

export interface SchoolInfo {
  name: string;
  mascot: string;
  city: string;
  lat: number;
  lng: number;
  coopHistory: CoopInfo[];
}

export interface DistrictYear {
  teams: string[];
}

export interface DistrictData {
  [year: number]: DistrictYear;
}

export interface AllDistrictsData {
  [district: number]: DistrictData;
}

// All district assignments by year
export const districtAssignments: AllDistrictsData = ${JSON.stringify(
  Object.fromEntries(
    Object.entries(districtData).map(([d, years]) => [
      d,
      Object.fromEntries(
        Object.entries(years).map(([y, teams]) => [y, { teams }])
      )
    ])
  ),
  null,
  2
)};

// School coordinates and info
export const schoolInfo: Record<string, SchoolInfo> = ${JSON.stringify(
  Object.fromEntries(
    uniqueSchools.map(school => {
      const coords = schoolCoords[school] || { lat: 0, lng: 0, city: '' };
      const mascotResult = lookupMascot(school, mascotLookup);
      const coopHistory = buildCoopHistoryForSchool(school);
      return [
        school,
        {
          name: school,
          mascot: mascotResult?.mascot || 'Unknown',
          city: mascotResult?.city || coords.city || '',
          lat: coords.lat || 0,
          lng: coords.lng || 0,
          coopHistory: coopHistory,
        }
      ];
    })
  ),
  null,
  2
)};

// List of all districts with data
export const availableDistricts = ${JSON.stringify(Object.keys(districtData).map(Number).sort((a,b) => a-b))};

// Year range
export const yearRange = {
  min: ${Math.min(...Object.values(districtData).flatMap(d => Object.keys(d).map(Number)))},
  max: ${Math.max(...Object.values(districtData).flatMap(d => Object.keys(d).map(Number)))},
};

// Get schools for a district in a given year
export function getSchoolsForDistrictYear(district: number, year: number): string[] {
  return districtAssignments[district]?.[year]?.teams || [];
}

// Get district for a school in a given year
export function getDistrictForSchool(schoolName: string, year: number): number | null {
  for (const [district, years] of Object.entries(districtAssignments)) {
    const yearData = years[year as keyof typeof years];
    if (yearData?.teams.some((t: string) => t.toLowerCase().includes(schoolName.toLowerCase()))) {
      return parseInt(district);
    }
  }
  return null;
}
`;

// Write the TypeScript file
const outputPath = path.join(__dirname, '..', 'app', 'data', 'allDistricts.ts');
fs.writeFileSync(outputPath, tsOutput);
console.log(`\n✅ Generated: ${outputPath}`);
