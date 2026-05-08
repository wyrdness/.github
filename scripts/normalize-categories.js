#!/usr/bin/env node
/**
 * Normalize phenomenon.category in every sibling repo's api.json to a single
 * canonical base category from the 16-value enum. Subcategory and all other
 * fields are preserved.
 *
 * Run inside Docker via `make normalize-categories` (dry run by default).
 * Pass --apply to write changes.
 */
const fs = require('fs');
const path = require('path');

const PARENT_DIR = path.join(__dirname, '../../');
const APPLY = process.argv.includes('--apply');
const EXCLUDE = new Set(['wyrdness.github.io', '.github', 'server', 'node_modules']);

const BASE_CATEGORIES = [
  'CRYPTID', 'UFO_UAP', 'GHOST_HAUNTING', 'ENTITY_SPIRIT', 'DEMON_ANGEL',
  'FAE_FOLKLORE', 'UNDEAD', 'SHAPESHIFTER', 'PSYCHIC_PHENOMENA', 'LOCATION',
  'ANOMALY', 'URBAN_LEGEND', 'MYTHOLOGICAL_CREATURE', 'ATMOSPHERIC_PHENOMENON',
  'CONSPIRACY_THEORY', 'CULTURAL_ARTIFACT'
];

// Priority-ordered patterns. First match wins.
// Order matters: more specific patterns first.
const MAPPINGS = [
  // Cultural / archaeological artifacts and texts
  [/ARCHAEOLOG|ANTIKYTHERA|VOYNICH|CRYSTAL_SKULL|GEOGLYPH|NAZCA|PIRI_REIS|MANUSCRIPT|LITERARY|ANCIENT_GEO|PSEUDOARCHAEOLOG|ARTIFACT/, 'CULTURAL_ARTIFACT'],

  // Atmospheric / lights
  [/ATMOSPHERIC|BALL_LIGHTNING|AURORA|ST.?ELMO|EARTHQUAKE_LIGHT|UNEXPLAINED_LIGHT|SKYQUAKE|MIN_MIN|MARFA|HESSDALEN|PHOENIX_LIGHT|BROWN_MOUNTAIN|PAULDING|FOO_FIGHTER|TAOS_HUM|SENECA_GUN/, 'ATMOSPHERIC_PHENOMENON'],

  // UFO / aliens / extraterrestrial
  [/UFO|UAP|FLYING_SAUCER|MEN_IN_BLACK|GREYS|REPTILIAN|FLATWOODS|HOPKINSVILLE|ROSWELL|RENDLESHAM|CASH.?LANDRUM|KECKSBURG|DULCE|BLACK_KNIGHT_SAT|MYSTERY_AIRSHIP|PHANTOM_SHIP/, 'UFO_UAP'],

  // Conspiracy / hoaxes / panics
  [/CONSPIRACY|HOAX|MORAL_PANIC|MOON_LANDING|FALSE_MEMOR|MANDELA|FLAT_EARTH|HOLLOW_EARTH|CHEMTRAIL|HAARP|MONTAUK|PHILADELPHIA_EXPER|RUSSIAN_SLEEP|MK_?ULTRA|ILLUMINATI|NEW_WORLD_ORDER|BOHEMIAN_GROVE|DENVER_AIRPORT|AREA_51|BLACK_SITE|SCP_FOUND|MOMO_CHALLENGE|LAVENDER_TOWN|POLYBIUS/, 'CONSPIRACY_THEORY'],

  // Psychic / consciousness
  [/PSYCHIC|TELEPATH|REMOTE_VIEW|PRECOGN|NEAR_DEATH|OUT_OF_BODY|CONSCIOUS|AUTOMATIC_WRITING|PSYCHOMETRY|BILOCATION|TIME_SLIP|GLITCH_IN_MATRIX|LIMINAL_SPACE|STONE_TAPE/, 'PSYCHIC_PHENOMENA'],

  // Shapeshifters
  [/SHAPESHIFT|WEREWOLF|WEREWOLVES|LYCANTHRO|SKINWALKER|LOUP.?GAROU|ROUGAROU|HULI_JING|GUMIHO|KITSUNE|TANUKI|KIDNEY_THIEVES/, 'SHAPESHIFTER'],

  // Undead / vampires / draugr
  [/UNDEAD|VAMPIRE|GHUL|GHOUL|REVENANT|JIANG_?SHI|ZOMBIE|STRIGOI|VRYKOLAKAS|NACHZEHRER|DRAUGR|UPYR|MORMO|VETALA|PHI_TAI_HONG|BHOOT/, 'UNDEAD'],

  // Demons / angels / Abrahamic spirits
  [/DEMON_ANGEL|^DEMON$|DEMONIC|FALLEN_ANGEL|ARCHANGEL|BELIAL|ASMODEUS|AZAZEL|BAEL|BEELZEBUB|MAMMON|BELPHEGOR|ASTAROTH/, 'DEMON_ANGEL'],

  // Fae / fairies / pixies / kobolds (must precede ENTITY_SPIRIT and LOCATION)
  [/FAE_FOLKLORE|FAIRIES|FAIRY|FAE_BEING|GOBLIN|BROWNIE|LEPRECHAUN|^PUCA$|PIXIE|SPRITE|SIDHE|TYLWYTH|CLURICHAUN|TROLL|HOBGOBLIN|MENEHUNE|HULDRE|REDCAP|DUENDE|CHANEQUE|ALUX|TOMTE|KNOCKER|TOMMYKNOCKER|KAPPA_FAE|IRISH_FAIRY|CELTIC.*FAIRY/, 'FAE_FOLKLORE'],

  // Ghosts / hauntings / poltergeists / spectres
  [/GHOST_HAUNTING|HAUNT|POLTERGEIST|SPECTR|APPARITION|RESURRECTION_MARY|VANISHING_HITCH|BANSHEE|WHITE_LADY|GREY_LADY|HANAKO|TEKE_TEKE|PHI_AM|HASSHAKU|KUCHISAKE|MAE_NAK|SCREAMING_SKULL|CRISIS_APPARITION/, 'GHOST_HAUNTING'],

  // Locations (haunted, sacred, geographic)
  [/HAUNTED_LOCATION|SACRED_SITE|^LOCATION|LOCATION_PHENOMENON|TRIANGLE|FOREST_(?!CRYPT)|MOUNTAIN|ISLAND|TOWN|HELLTOWN|AOKIGAHARA|HOIA_BACIU|GETTYSBURG|WAVERLY_HILLS|TOWER_OF_LONDON|EILEAN_MOR|SUPERSTITION_MOUNTAIN|MOUNT_SHASTA|EASTER_ISLAND|STONEHENGE|TEOTIHUACAN|GLASTONBURY|ROANOKE|SEDONA|SKINWALKER_RANCH|MARY_CELESTE|OAK_ISLAND|DYATLOV/, 'LOCATION'],

  // Internet / urban / modern legends
  [/INTERNET_FOLKLORE|INTERNET_URBAN|MODERN_FOLKLORE|MODERN_INTERNET|URBAN_LEGEND|CREEPYPASTA|MEME|MORAL_PANIC|MODERN_LEGEND|VIRAL_LEGEND/, 'URBAN_LEGEND'],

  // Mythological creatures (Greek/Norse/Hindu/etc.) — must come after fae/undead/demons
  [/MYTHOLOGICAL_CREATURE|MYTHIC|LEGENDARY|HINDU_MYTH|EUROPEAN_DRAGON|GREEK_MYTH|NORSE_MYTH|MYTHOLOGY/, 'MYTHOLOGICAL_CREATURE'],

  // Cryptids — modern unknown animals (must come after MYTHOLOGICAL_CREATURE)
  [/^CRYPTID|FEARSOME_CRITTER|HIDDEN_ANIMAL|SEA_CRYPTID|MARINE_MYSTER|MODERN_CRYPTID|CRYPTID_/, 'CRYPTID'],

  // Spirit / entity / yokai / jinn (catch-all spirits)
  [/ENTITY_SPIRIT|^ENTITY|YOKAI|SUPERNATURAL_(BEING|ENTITY)|JINN|DJINN|GENIE|^SPIRIT|NATURE_SPIRIT|HANTU|FOLKLORE_ENTITY|MALEVOLENT.*BEING|MALEVOLENT.*ENTIT|SERVANT_SPIRIT|JAPANESE_SUPERNATURAL/, 'ENTITY_SPIRIT'],

  // Anomalies (catch-all for things that don't fit elsewhere)
  [/^ANOMALY|ANOMALOUS|UNKNOWN_PHENOM|PERCEPTION.?BASED|SPONTANEOUS_HUMAN_COMBUSTION/, 'ANOMALY']
];

// Hard-coded fallbacks by repo id (used when category is empty or unmappable)
const NAME_FALLBACKS = {
  // Cryptids
  'bigfoot': 'CRYPTID', 'yeti': 'CRYPTID', 'mokele-mbembe': 'CRYPTID',
  'chupacabra': 'CRYPTID', 'jersey-devil': 'CRYPTID', 'mothman': 'CRYPTID',
  'loch-ness-monster': 'CRYPTID', 'ogopogo': 'CRYPTID', 'champ': 'CRYPTID',
  'caddy': 'CRYPTID', 'altamaha-ha': 'CRYPTID', 'bessie': 'CRYPTID',
  'globster': 'CRYPTID', 'lusca': 'CRYPTID', 'bunyip': 'CRYPTID',
  'orang-pendek': 'CRYPTID', 'almas': 'CRYPTID', 'yowie': 'CRYPTID',
  'yeren': 'CRYPTID', 'batutut': 'CRYPTID', 'nguoi-rung': 'CRYPTID',
  'orang-bati': 'CRYPTID', 'orang-dalam': 'CRYPTID', 'orang-gadang': 'CRYPTID',
  'moehau-man': 'CRYPTID', 'man-monkey': 'CRYPTID', 'wampus-cat': 'CRYPTID',
  'fur-bearing-trout': 'CRYPTID', 'jackalope': 'CRYPTID',
  'beast-of-bray-road': 'CRYPTID', 'dover-demon': 'CRYPTID',
  'enfield-horror': 'CRYPTID', 'flatwoods-monster': 'UFO_UAP',
  'lizard-man-scape-ore': 'CRYPTID', 'goatman': 'CRYPTID',
  'pope-lick-monster': 'CRYPTID', 'grafton-monster': 'CRYPTID',
  'sirenhead': 'URBAN_LEGEND', 'fresno-nightcrawlers': 'CRYPTID',
  'minhocao': 'CRYPTID', 'mongolian-death-worm': 'CRYPTID',
  'snallygaster': 'CRYPTID', 'hodag': 'CRYPTID', 'mapinguari': 'CRYPTID',

  // Atmospheric
  'ball-lightning': 'ATMOSPHERIC_PHENOMENON', 'aurora-phenomena': 'ATMOSPHERIC_PHENOMENON',
  'st-elmos-fire': 'ATMOSPHERIC_PHENOMENON', 'taos-hum': 'ATMOSPHERIC_PHENOMENON',
  'min-min-lights': 'ATMOSPHERIC_PHENOMENON', 'marfa-lights': 'ATMOSPHERIC_PHENOMENON',
  'hessdalen-lights': 'ATMOSPHERIC_PHENOMENON', 'phoenix-lights': 'UFO_UAP',
  'paulding-light': 'ATMOSPHERIC_PHENOMENON', 'brown-mountain-lights': 'ATMOSPHERIC_PHENOMENON',
  'earthquake-lights': 'ATMOSPHERIC_PHENOMENON', 'will-o-wisp': 'ATMOSPHERIC_PHENOMENON',
  'corpse-candle': 'ATMOSPHERIC_PHENOMENON', 'foo-fighters': 'UFO_UAP',
  'skyquakes': 'ATMOSPHERIC_PHENOMENON', 'seneca-guns': 'ATMOSPHERIC_PHENOMENON',

  // UFO / aliens
  'aliens': 'UFO_UAP', 'greys': 'UFO_UAP', 'reptilians': 'UFO_UAP',
  'men-in-black': 'UFO_UAP', 'roswell-incident': 'UFO_UAP',
  'rendlesham-forest': 'UFO_UAP', 'cash-landrum-incident': 'UFO_UAP',
  'kecksburg-incident': 'UFO_UAP', 'hopkinsville-goblins': 'UFO_UAP',
  'mystery-airships': 'UFO_UAP', 'phantom-ships': 'UFO_UAP',
  'black-knight-satellite': 'CONSPIRACY_THEORY', 'van-meter-visitor': 'UFO_UAP',
  'atmospheric-beasts': 'CRYPTID', 'cheollima': 'MYTHOLOGICAL_CREATURE',

  // Conspiracy / hoaxes
  'area-51': 'CONSPIRACY_THEORY', 'dulce-base': 'CONSPIRACY_THEORY',
  'denver-airport': 'CONSPIRACY_THEORY', 'bohemian-grove': 'CONSPIRACY_THEORY',
  'illuminati': 'CONSPIRACY_THEORY', 'new-world-order': 'CONSPIRACY_THEORY',
  'flat-earth': 'CONSPIRACY_THEORY', 'hollow-earth': 'CONSPIRACY_THEORY',
  'chemtrails': 'CONSPIRACY_THEORY', 'haarp': 'CONSPIRACY_THEORY',
  'montauk-project': 'CONSPIRACY_THEORY', 'philadelphia-experiment': 'CONSPIRACY_THEORY',
  'moon-landing-hoax': 'CONSPIRACY_THEORY', 'mandela-effect': 'CONSPIRACY_THEORY',
  'time-traveler-john-titor': 'CONSPIRACY_THEORY',
  'russian-sleep-experiment': 'URBAN_LEGEND', 'momo-challenge': 'URBAN_LEGEND',
  'lavender-town-syndrome': 'URBAN_LEGEND', 'polybius': 'URBAN_LEGEND',
  'scp-foundation': 'URBAN_LEGEND', 'crawler': 'URBAN_LEGEND',

  // Psychic / consciousness
  'telepathy': 'PSYCHIC_PHENOMENA', 'precognition': 'PSYCHIC_PHENOMENA',
  'remote-viewing': 'PSYCHIC_PHENOMENA', 'psychometry': 'PSYCHIC_PHENOMENA',
  'near-death-experiences': 'PSYCHIC_PHENOMENA',
  'out-of-body-experiences': 'PSYCHIC_PHENOMENA',
  'automatic-writing': 'PSYCHIC_PHENOMENA',
  'electronic-voice-phenomena': 'PSYCHIC_PHENOMENA',
  'bilocation': 'PSYCHIC_PHENOMENA', 'time-slips': 'PSYCHIC_PHENOMENA',
  'glitch-in-matrix': 'PSYCHIC_PHENOMENA', 'liminal-spaces': 'URBAN_LEGEND',
  'stone-tape-theory': 'PSYCHIC_PHENOMENA', 'psychic-phenomena': 'PSYCHIC_PHENOMENA',
  'spontaneous-human-combustion': 'ANOMALY', 'kunekune': 'URBAN_LEGEND',

  // Shapeshifters
  'werewolves': 'SHAPESHIFTER', 'loup-garou': 'SHAPESHIFTER',
  'wendigo': 'SHAPESHIFTER', 'wendigo-cree': 'SHAPESHIFTER',
  'windigo': 'SHAPESHIFTER', 'skinwalkers': 'SHAPESHIFTER',
  'kitsune': 'SHAPESHIFTER', 'gumiho': 'SHAPESHIFTER',
  'huli-jing': 'SHAPESHIFTER', 'tamamo-no-mae': 'SHAPESHIFTER',
  'nine-tailed-fox': 'SHAPESHIFTER', 'fox-sister': 'SHAPESHIFTER',
  'aswang': 'SHAPESHIFTER', 'manananggal': 'SHAPESHIFTER',
  'penanggalan': 'SHAPESHIFTER', 'nekomata': 'SHAPESHIFTER',
  'bakeneko': 'SHAPESHIFTER', 'tikbalang': 'SHAPESHIFTER',

  // Undead
  'vampires': 'UNDEAD', 'draugr': 'UNDEAD', 'jiangshi': 'UNDEAD',
  'strigoi': 'UNDEAD', 'vrykolakas': 'UNDEAD', 'nachzehrer': 'UNDEAD',
  'upyr': 'UNDEAD', 'strzyga': 'UNDEAD', 'ghul': 'UNDEAD',
  'asanbosam': 'UNDEAD', 'soucouyant': 'UNDEAD', 'pontianak': 'UNDEAD',
  'sundel-bolong': 'UNDEAD', 'pocong': 'UNDEAD', 'krasue': 'UNDEAD',
  'leak': 'UNDEAD', 'phi-tai-hong': 'UNDEAD', 'mae-nak': 'GHOST_HAUNTING',
  'bhoot': 'UNDEAD', 'duppy': 'UNDEAD', 'jumbie': 'GHOST_HAUNTING',
  'la-llorona': 'GHOST_HAUNTING', 'revenant': 'UNDEAD',
  'vetala': 'UNDEAD', 'pishacha': 'UNDEAD',

  // Demons / angels
  'demons': 'DEMON_ANGEL', 'belial': 'DEMON_ANGEL', 'beelzebub': 'DEMON_ANGEL',
  'asmodeus': 'DEMON_ANGEL', 'azazel': 'DEMON_ANGEL', 'astaroth': 'DEMON_ANGEL',
  'mammon': 'DEMON_ANGEL', 'belphegor': 'DEMON_ANGEL', 'imp': 'DEMON_ANGEL',
  'ifrit': 'ENTITY_SPIRIT', 'krampus': 'DEMON_ANGEL',
  'satori': 'ENTITY_SPIRIT',

  // Fae
  'fairies': 'FAE_FOLKLORE', 'leprechaun': 'FAE_FOLKLORE',
  'brownie': 'FAE_FOLKLORE', 'puca': 'FAE_FOLKLORE', 'tylwyth-teg': 'FAE_FOLKLORE',
  'aos-si': 'FAE_FOLKLORE', 'clurichaun': 'FAE_FOLKLORE',
  'changeling': 'FAE_FOLKLORE', 'goblin': 'FAE_FOLKLORE',
  'hobgoblin': 'FAE_FOLKLORE', 'redcap': 'FAE_FOLKLORE',
  'duende': 'FAE_FOLKLORE', 'chaneque': 'FAE_FOLKLORE',
  'alux': 'FAE_FOLKLORE', 'menehune': 'FAE_FOLKLORE',
  'huldre': 'FAE_FOLKLORE', 'patupaiarehe': 'FAE_FOLKLORE',
  'knocker': 'FAE_FOLKLORE', 'tommyknockers': 'FAE_FOLKLORE',
  'trolls': 'FAE_FOLKLORE', 'erlking': 'FAE_FOLKLORE',
  'wolpertinger': 'CRYPTID', 'skvader': 'CRYPTID',
  'gillygaloo': 'CRYPTID', 'goofang': 'CRYPTID',
  'fearsome-critters': 'CRYPTID',

  // Ghosts
  'ghosts': 'GHOST_HAUNTING', 'banshee': 'GHOST_HAUNTING',
  'poltergeist': 'GHOST_HAUNTING', 'white-lady': 'GHOST_HAUNTING',
  'grey-lady': 'GHOST_HAUNTING', 'hanako-san': 'GHOST_HAUNTING',
  'hasshaku-sama': 'GHOST_HAUNTING', 'kuchisake-onna': 'GHOST_HAUNTING',
  'teke-teke': 'GHOST_HAUNTING', 'phi-am': 'GHOST_HAUNTING',
  'screaming-skull': 'GHOST_HAUNTING', 'crisis-apparition': 'GHOST_HAUNTING',
  'hantu-bungkus': 'GHOST_HAUNTING',
  'caoineag': 'GHOST_HAUNTING', 'dames-blanches': 'GHOST_HAUNTING',
  'siguanaba': 'GHOST_HAUNTING', 'la-diablesse': 'GHOST_HAUNTING',
  'resurrection-mary': 'GHOST_HAUNTING', 'vanishing-hitchhiker': 'GHOST_HAUNTING',
  'haunted-places': 'GHOST_HAUNTING', 'phantom-armies': 'GHOST_HAUNTING',
  'wild-hunt': 'MYTHOLOGICAL_CREATURE', 'nightmarchers': 'GHOST_HAUNTING',
  'headless-horseman': 'GHOST_HAUNTING',

  // Locations
  'aokigahara': 'LOCATION', 'hoia-baciu-forest': 'LOCATION',
  'gettysburg-battlefield': 'LOCATION', 'waverly-hills': 'LOCATION',
  'tower-of-london': 'LOCATION', 'eilean-mor-lighthouse': 'LOCATION',
  'superstition-mountains': 'LOCATION', 'mount-shasta': 'LOCATION',
  'easter-island': 'LOCATION', 'stonehenge': 'LOCATION',
  'teotihuacan': 'LOCATION', 'glastonbury-tor': 'LOCATION',
  'roanoke-colony': 'LOCATION', 'sedona-vortexes': 'LOCATION',
  'skinwalker-ranch': 'LOCATION', 'mary-celeste': 'LOCATION',
  'oak-island': 'LOCATION', 'dyatlov-pass': 'LOCATION',
  'bermuda-triangle': 'LOCATION', 'bridgewater-triangle': 'LOCATION',
  'bennington-triangle': 'LOCATION', 'helltown-ohio': 'LOCATION',
  'cropsey': 'URBAN_LEGEND', 'ley-lines': 'ANOMALY',
  'tunguska-event': 'ANOMALY',

  // Cultural artifacts
  'antikythera-mechanism': 'CULTURAL_ARTIFACT',
  'voynich-manuscript': 'CULTURAL_ARTIFACT',
  'crystal-skulls': 'CULTURAL_ARTIFACT',
  'piri-reis-map': 'CULTURAL_ARTIFACT',
  'nazca-lines': 'CULTURAL_ARTIFACT',

  // Mythological creatures
  'unicorn': 'MYTHOLOGICAL_CREATURE', 'pegasus': 'MYTHOLOGICAL_CREATURE',
  'centaur': 'MYTHOLOGICAL_CREATURE', 'sphinx': 'MYTHOLOGICAL_CREATURE',
  'minotaur': 'MYTHOLOGICAL_CREATURE', 'cerberus': 'MYTHOLOGICAL_CREATURE',
  'cyclops': 'MYTHOLOGICAL_CREATURE', 'medusa': 'MYTHOLOGICAL_CREATURE',
  'gorgon': 'MYTHOLOGICAL_CREATURE', 'hydra': 'MYTHOLOGICAL_CREATURE',
  'chimera': 'MYTHOLOGICAL_CREATURE', 'griffin': 'MYTHOLOGICAL_CREATURE',
  'harpy': 'MYTHOLOGICAL_CREATURE', 'phoenix': 'MYTHOLOGICAL_CREATURE',
  'kraken': 'MYTHOLOGICAL_CREATURE', 'siren': 'MYTHOLOGICAL_CREATURE',
  'satyr': 'MYTHOLOGICAL_CREATURE', 'fenrir': 'MYTHOLOGICAL_CREATURE',
  'jormungandr': 'MYTHOLOGICAL_CREATURE', 'sleipnir': 'MYTHOLOGICAL_CREATURE',
  'valkyrie': 'MYTHOLOGICAL_CREATURE', 'maui': 'MYTHOLOGICAL_CREATURE',
  'taniwha': 'MYTHOLOGICAL_CREATURE', 'naga': 'MYTHOLOGICAL_CREATURE',
  'garuda': 'MYTHOLOGICAL_CREATURE', 'simurgh': 'MYTHOLOGICAL_CREATURE',
  'roc': 'MYTHOLOGICAL_CREATURE', 'kirin': 'MYTHOLOGICAL_CREATURE',
  'qilin': 'MYTHOLOGICAL_CREATURE', 'cheollima': 'MYTHOLOGICAL_CREATURE',
  'haetae': 'MYTHOLOGICAL_CREATURE', 'samjoko': 'MYTHOLOGICAL_CREATURE',
  'bai-ze': 'MYTHOLOGICAL_CREATURE', 'baku': 'MYTHOLOGICAL_CREATURE',
  'yamata-no-orochi': 'MYTHOLOGICAL_CREATURE', 'lamassu': 'MYTHOLOGICAL_CREATURE',
  'cockatrice': 'MYTHOLOGICAL_CREATURE', 'basilisk': 'MYTHOLOGICAL_CREATURE',
  'lindworm': 'MYTHOLOGICAL_CREATURE', 'zmey': 'MYTHOLOGICAL_CREATURE',
  'dragon': 'MYTHOLOGICAL_CREATURE', 'al-miraj': 'MYTHOLOGICAL_CREATURE',
  'buraq': 'MYTHOLOGICAL_CREATURE', 'ammit': 'MYTHOLOGICAL_CREATURE',
  'anubis': 'MYTHOLOGICAL_CREATURE', 'bulgae': 'MYTHOLOGICAL_CREATURE',
  'ceasg': 'MYTHOLOGICAL_CREATURE', 'cu-sith': 'MYTHOLOGICAL_CREATURE',
  'each-uisge': 'MYTHOLOGICAL_CREATURE', 'kelpie': 'MYTHOLOGICAL_CREATURE',
  'selkie': 'MYTHOLOGICAL_CREATURE', 'iara': 'MYTHOLOGICAL_CREATURE',
  'tatzelwurm': 'CRYPTID',

  // Spirits / yokai / jinn / hantu (catch-all)
  'jinn': 'ENTITY_SPIRIT', 'djinn': 'ENTITY_SPIRIT',
  'marid': 'ENTITY_SPIRIT', 'div': 'ENTITY_SPIRIT', 'peri': 'ENTITY_SPIRIT',
  'ifrit': 'ENTITY_SPIRIT', 'al-khidr': 'ENTITY_SPIRIT',
  'tengu': 'ENTITY_SPIRIT', 'oni': 'ENTITY_SPIRIT',
  'kappa': 'ENTITY_SPIRIT', 'rokurokubi': 'ENTITY_SPIRIT',
  'futakuchi-onna': 'ENTITY_SPIRIT', 'yuki-onna': 'ENTITY_SPIRIT',
  'yama-uba': 'ENTITY_SPIRIT', 'ubume': 'ENTITY_SPIRIT',
  'jorogumo': 'ENTITY_SPIRIT', 'gashadokuro': 'ENTITY_SPIRIT',
  'shuten-doji': 'ENTITY_SPIRIT', 'ibaraki-doji': 'ENTITY_SPIRIT',
  'enenra': 'ENTITY_SPIRIT', 'nurikabe': 'ENTITY_SPIRIT',
  'nurarihyon': 'ENTITY_SPIRIT', 'nuppeppo': 'ENTITY_SPIRIT',
  'akaname': 'ENTITY_SPIRIT', 'kasa-obake': 'ENTITY_SPIRIT',
  'chochinobake': 'ENTITY_SPIRIT', 'tsukumogami': 'ENTITY_SPIRIT',
  'wanyudo': 'ENTITY_SPIRIT', 'ittan-momen': 'ENTITY_SPIRIT',
  'abumi-guchi': 'ENTITY_SPIRIT', 'satori': 'ENTITY_SPIRIT',
  'yama-no-kami': 'ENTITY_SPIRIT', 'kawa-no-kami': 'ENTITY_SPIRIT',
  'yama-oroshi': 'ENTITY_SPIRIT', 'hitotsume-kozo': 'ENTITY_SPIRIT',
  'betobeto-san': 'ENTITY_SPIRIT', 'inugami': 'ENTITY_SPIRIT',
  'gozu': 'ENTITY_SPIRIT', 'mogwai': 'ENTITY_SPIRIT',
  'dokkaebi': 'ENTITY_SPIRIT', 'leshy': 'ENTITY_SPIRIT',
  'domovoi': 'ENTITY_SPIRIT', 'bannik': 'ENTITY_SPIRIT',
  'kikimora': 'ENTITY_SPIRIT', 'rusalka': 'ENTITY_SPIRIT',
  'vodyanoy': 'ENTITY_SPIRIT', 'vila': 'ENTITY_SPIRIT',
  'likho': 'ENTITY_SPIRIT', 'baba-yaga': 'ENTITY_SPIRIT',
  'poludnitsa': 'ENTITY_SPIRIT', 'shtriga': 'ENTITY_SPIRIT',
  'banaspati': 'ENTITY_SPIRIT', 'hantu-air': 'ENTITY_SPIRIT',
  'hantu-bungkus': 'ENTITY_SPIRIT', 'hantu-jerangan': 'ENTITY_SPIRIT',
  'hantu-pontianak': 'UNDEAD', 'hantu-raya': 'ENTITY_SPIRIT',
  'hantu-tetek': 'ENTITY_SPIRIT', 'orang-minyak': 'ENTITY_SPIRIT',
  'pelesit': 'ENTITY_SPIRIT', 'toyol': 'ENTITY_SPIRIT',
  'langsuir': 'ENTITY_SPIRIT', 'pee-sua-samut': 'ENTITY_SPIRIT',
  'nang-mai': 'ENTITY_SPIRIT', 'nang-tani': 'ENTITY_SPIRIT',
  'nang-kwak': 'ENTITY_SPIRIT', 'krasue': 'UNDEAD',
  'eloko': 'ENTITY_SPIRIT', 'kapre': 'ENTITY_SPIRIT',
  'tikbalang': 'ENTITY_SPIRIT', 'douen': 'ENTITY_SPIRIT',
  'rolling-calf': 'ENTITY_SPIRIT', 'lagahoo': 'SHAPESHIFTER',
  'el-cadejo': 'ENTITY_SPIRIT', 'el-silbon': 'GHOST_HAUNTING',
  'el-sisimite': 'CRYPTID', 'el-sombrerón': 'ENTITY_SPIRIT',
  'mama-dlo': 'ENTITY_SPIRIT', 'papa-bois': 'ENTITY_SPIRIT',
  'mohan': 'ENTITY_SPIRIT', 'patasola': 'ENTITY_SPIRIT',
  'madremonte': 'ENTITY_SPIRIT', 'tunda': 'ENTITY_SPIRIT',
  'caipora': 'ENTITY_SPIRIT', 'curupira': 'ENTITY_SPIRIT',
  'chullachaqui': 'ENTITY_SPIRIT', 'yacuruna': 'ENTITY_SPIRIT',
  'yara-ma-yha-who': 'ENTITY_SPIRIT', 'encantado': 'SHAPESHIFTER',
  'boto-cor-de-rosa': 'SHAPESHIFTER', 'iara': 'MYTHOLOGICAL_CREATURE',
  'bonfim': 'ENTITY_SPIRIT', 'saci': 'ENTITY_SPIRIT',
  'jengu': 'ENTITY_SPIRIT', 'tokoloshe': 'ENTITY_SPIRIT',
  'mamlambo': 'ENTITY_SPIRIT', 'mngwa': 'CRYPTID',
  'impundulu': 'CRYPTID', 'kongamato': 'CRYPTID',
  'nandi-bear': 'CRYPTID', 'marozi': 'CRYPTID',
  'dingonek': 'CRYPTID', 'agogwe': 'CRYPTID',
  'ninki-nanka': 'CRYPTID', 'grootslang': 'CRYPTID',
  'qarqash': 'ENTITY_SPIRIT', 'al-khidr': 'ENTITY_SPIRIT',
  'gello': 'ENTITY_SPIRIT', 'empusa': 'ENTITY_SPIRIT',
  'mahr': 'ENTITY_SPIRIT', 'mara': 'ENTITY_SPIRIT',
  'mare': 'ENTITY_SPIRIT', 'drude': 'ENTITY_SPIRIT',
  'alp': 'ENTITY_SPIRIT', 'nightmare': 'PSYCHIC_PHENOMENA',
  'night-hag': 'ENTITY_SPIRIT', 'wewe-gombel': 'ENTITY_SPIRIT',
  'qallupilluk': 'ENTITY_SPIRIT', 'ijiraq': 'ENTITY_SPIRIT',
  'mahaha': 'ENTITY_SPIRIT', 'amarok': 'CRYPTID',
  'adlet': 'CRYPTID', 'aj-acha-te-oh-te': 'ENTITY_SPIRIT',
  'ankou': 'ENTITY_SPIRIT', 'ap': 'ENTITY_SPIRIT',
  'azazel': 'DEMON_ANGEL', 'basket-woman': 'ENTITY_SPIRIT',
  'berchta': 'ENTITY_SPIRIT', 'berserker': 'MYTHOLOGICAL_CREATURE',
  'ben-drowned': 'URBAN_LEGEND', 'come-at-a-body': 'CRYPTID',
  'curse-of-the-pharaohs': 'CONSPIRACY_THEORY',
  'jeff-the-killer': 'URBAN_LEGEND', 'eyeless-jack': 'URBAN_LEGEND',
  'rake': 'URBAN_LEGEND', 'slenderman': 'URBAN_LEGEND',
  'smile-dog': 'URBAN_LEGEND', 'candle-cove': 'URBAN_LEGEND',
  'backrooms': 'URBAN_LEGEND', 'urban-legends': 'URBAN_LEGEND',
  'black-eyed-children': 'URBAN_LEGEND', 'shadow-people': 'URBAN_LEGEND',
  'black-dog': 'CRYPTID', 'black-shuck': 'CRYPTID',
  'cu-sith': 'MYTHOLOGICAL_CREATURE', 'beast-of-gevaudan': 'CRYPTID',
  'dogman': 'CRYPTID', 'batsquatch': 'CRYPTID',
  'thunderbird': 'CRYPTID', 'piasa': 'CRYPTID',
  'owlman': 'CRYPTID', 'spring-heeled-jack': 'CRYPTID',
  'bunny-man': 'URBAN_LEGEND', 'charlie-no-face': 'URBAN_LEGEND',
  'melon-heads': 'URBAN_LEGEND', 'hidebehind': 'CRYPTID',
  'hookman': 'URBAN_LEGEND', 'tailypo': 'CRYPTID',
  'wampus-cat': 'CRYPTID', 'cactus-cat': 'CRYPTID',
  'agropelter': 'CRYPTID', 'argopelter': 'CRYPTID',
  'axehandle-hound': 'CRYPTID', 'billdad': 'CRYPTID',
  'dungavenhooter': 'CRYPTID', 'gumberoo': 'CRYPTID',
  'hoopsnake': 'CRYPTID', 'joint-snake': 'CRYPTID',
  'hugag': 'CRYPTID', 'luferlang': 'CRYPTID',
  'ozark-howler': 'CRYPTID', 'roperite': 'CRYPTID',
  'rumtifusel': 'CRYPTID', 'sidehill-gouger': 'CRYPTID',
  'slide-rock-bolter': 'CRYPTID', 'splintercat': 'CRYPTID',
  'squonk': 'CRYPTID', 'teakettler': 'CRYPTID',
  'tote-road-shagamaw': 'CRYPTID', 'tripodero': 'CRYPTID',
  'whirling-whimpus': 'CRYPTID', 'drop-bear': 'CRYPTID',
  'caddy': 'CRYPTID', 'cadborosaurus': 'CRYPTID',
  'dobhar-chu': 'CRYPTID', 'dingonek': 'CRYPTID',
  'emela-ntouka': 'CRYPTID', 'chipekwe': 'CRYPTID',
  'beast-of-bray-road': 'CRYPTID',
  'nuckelavee': 'MYTHOLOGICAL_CREATURE', 'nue': 'MYTHOLOGICAL_CREATURE',
  'nguruvilu': 'MYTHOLOGICAL_CREATURE', 'basilisco-chilote': 'MYTHOLOGICAL_CREATURE',
  'ahool': 'CRYPTID', 'ropen': 'CRYPTID', 'orang-bati': 'CRYPTID',
  'ahuizotl': 'MYTHOLOGICAL_CREATURE', 'abada': 'MYTHOLOGICAL_CREATURE',
  'al-mi\'raj': 'MYTHOLOGICAL_CREATURE', 'almas': 'CRYPTID',
  'kongamato': 'CRYPTID', 'aliens': 'UFO_UAP',
  'ciguapa': 'ENTITY_SPIRIT', 'xtabay': 'ENTITY_SPIRIT',
  'douen': 'ENTITY_SPIRIT', 'deer-woman': 'SHAPESHIFTER',
  'stick-indian': 'CRYPTID', 'not-deer': 'CRYPTID',
  'pope-lick-monster': 'CRYPTID', 'momo': 'CRYPTID',
  'jersey-devil': 'CRYPTID', 'fox-sister': 'SHAPESHIFTER',
  'cheollima': 'MYTHOLOGICAL_CREATURE',
  'snallygaster': 'CRYPTID',
  'mongolian-death-worm': 'CRYPTID',
  'mokele-mbembe': 'CRYPTID', 'minhocao': 'CRYPTID',
  'bake-kujira': 'CRYPTID', 'gozu': 'ENTITY_SPIRIT',
  'manticore': 'MYTHOLOGICAL_CREATURE',
  'rakshasa': 'MYTHOLOGICAL_CREATURE',
  'bhoot': 'UNDEAD', 'pishacha': 'UNDEAD',
  'khaiku': 'ENTITY_SPIRIT',
  'orang-pendek': 'CRYPTID',
  'ebu-gogo': 'CRYPTID', 'yara-ma-yha-who': 'ENTITY_SPIRIT',
  'aliens': 'UFO_UAP', 'exorcism': 'ANOMALY',
  'possession': 'ANOMALY', 'elemental-spirits': 'ENTITY_SPIRIT',
  'phoenix': 'MYTHOLOGICAL_CREATURE',
  'orang-pendek': 'CRYPTID', 'orang-bati': 'CRYPTID',
  'orang-dalam': 'CRYPTID', 'orang-gadang': 'CRYPTID',
  'caoineag': 'GHOST_HAUNTING',
  'kidney-thieves': 'URBAN_LEGEND',
  'kunekune': 'URBAN_LEGEND',
  'membership': 'CONSPIRACY_THEORY',
  'globster': 'CRYPTID',
  'fearsome-critters': 'CRYPTID', 'champ': 'CRYPTID',
  'bessie': 'CRYPTID', 'altamaha-ha': 'CRYPTID',
  'leak': 'UNDEAD', 'agropelter': 'CRYPTID',
  'aurora-phenomena': 'ATMOSPHERIC_PHENOMENON',
  'minotaur': 'MYTHOLOGICAL_CREATURE',
  'medusa': 'MYTHOLOGICAL_CREATURE',
  'cyclops': 'MYTHOLOGICAL_CREATURE',
  'samjoko': 'MYTHOLOGICAL_CREATURE',
  'haetae': 'MYTHOLOGICAL_CREATURE',
  'cheollima': 'MYTHOLOGICAL_CREATURE',
  'banshee': 'GHOST_HAUNTING',
  'caoineag': 'GHOST_HAUNTING',
  'el-sombrer-n': 'ENTITY_SPIRIT', // historical, kept in case it returns
  'el-sombrerón': 'ENTITY_SPIRIT',
  'tomte': 'FAE_FOLKLORE',
  'splintercat': 'CRYPTID',
  'rumtifusel': 'CRYPTID',
  'horned-serpent': 'MYTHOLOGICAL_CREATURE',
  'fenrir': 'MYTHOLOGICAL_CREATURE',
  'jormungandr': 'MYTHOLOGICAL_CREATURE',
  'sleipnir': 'MYTHOLOGICAL_CREATURE',
  'valkyrie': 'MYTHOLOGICAL_CREATURE',
  'wild-hunt': 'MYTHOLOGICAL_CREATURE',
  'erlking': 'FAE_FOLKLORE',
  'nachtkrapp': 'CRYPTID',
  'wolpertinger': 'CRYPTID',
  'skvader': 'CRYPTID',
  'gillygaloo': 'CRYPTID',
  'goofang': 'CRYPTID',
  'fur-bearing-trout': 'CRYPTID',
  'jackalope': 'CRYPTID',
  'cactus-cat': 'CRYPTID',
  'agropelter': 'CRYPTID',
  'argopelter': 'CRYPTID',
  'axehandle-hound': 'CRYPTID',
  'billdad': 'CRYPTID',
  'dungavenhooter': 'CRYPTID',
  'gumberoo': 'CRYPTID',
  'hoopsnake': 'CRYPTID',
  'joint-snake': 'CRYPTID',
  'hugag': 'CRYPTID',
  'luferlang': 'CRYPTID',
  'ozark-howler': 'CRYPTID',
  'roperite': 'CRYPTID',
  'sidehill-gouger': 'CRYPTID',
  'slide-rock-bolter': 'CRYPTID',
  'squonk': 'CRYPTID',
  'teakettler': 'CRYPTID',
  'tote-road-shagamaw': 'CRYPTID',
  'tripodero': 'CRYPTID',
  'whirling-whimpus': 'CRYPTID'
};

function inferFromPattern(s) {
  for (const [pattern, target] of MAPPINGS) {
    if (pattern.test(s)) return target;
  }
  return null;
}

function normalizeCategory(rawCategory, repoId) {
  const cat = (rawCategory || '').toString();
  const stripped = cat.toUpperCase()
    .replace(/^\|_+|_+\|$/g, '')
    .replace(/^\||\|$/g, '')
    .trim();

  // Already canonical — keep as-is
  if (BASE_CATEGORIES.includes(stripped)) return stripped;

  // Per-repo override wins over regex (manual classification is more accurate
  // for repos where the upstream category string is garbage or hybridized).
  if (NAME_FALLBACKS[repoId]) return NAME_FALLBACKS[repoId];

  // Pattern match on the cleaned string
  const fromCleaned = inferFromPattern(stripped);
  if (fromCleaned) return fromCleaned;

  // Pattern match on raw string (catches embedded keywords in long sentences)
  const fromRaw = inferFromPattern(cat.toUpperCase());
  if (fromRaw) return fromRaw;

  // Last resort: ANOMALY
  return 'ANOMALY';
}

function listPhenomenonDirs() {
  return fs.readdirSync(PARENT_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && !EXCLUDE.has(e.name))
    .map(e => e.name)
    .sort();
}

function main() {
  const dirs = listPhenomenonDirs();
  let changed = 0;
  let unchanged = 0;
  let missing = 0;
  const transitions = new Map();

  for (const name of dirs) {
    const apiPath = path.join(PARENT_DIR, name, 'api.json');
    if (!fs.existsSync(apiPath)) {
      missing++;
      continue;
    }

    let data;
    try {
      data = JSON.parse(fs.readFileSync(apiPath, 'utf8'));
    } catch (err) {
      console.error(`parse error: ${name} ${err.message}`);
      continue;
    }

    const before = (data.phenomenon && data.phenomenon.category) || '';
    const after = normalizeCategory(before, name);

    const key = `${before} → ${after}`;
    transitions.set(key, (transitions.get(key) || 0) + 1);

    if (before === after) {
      unchanged++;
      continue;
    }

    if (APPLY) {
      data.phenomenon = data.phenomenon || {};
      data.phenomenon.category = after;
      fs.writeFileSync(apiPath, JSON.stringify(data, null, 2) + '\n');
    }
    changed++;
  }

  console.log(`Repos:      ${dirs.length}`);
  console.log(`Changed:    ${changed}${APPLY ? '' : ' (dry run)'}`);
  console.log(`Unchanged:  ${unchanged}`);
  console.log(`Missing:    ${missing}`);

  // Sort transitions by frequency
  const sorted = [...transitions.entries()].sort((a, b) => b[1] - a[1]);
  console.log('\nTransitions (count: before → after):');
  for (const [t, c] of sorted) {
    console.log(`  ${String(c).padStart(4)}  ${t}`);
  }

  if (!APPLY) {
    console.log('\nDry run only. Pass --apply to write changes.');
  }
}

main();
