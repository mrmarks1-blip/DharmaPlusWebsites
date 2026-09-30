"""Build the prostrations booklet: content below -> booklet.html -> PDF (via Edge/Chrome).

Run from anywhere:  python print/build.py
It writes print/booklet.html. To make the PDF, serve the repo folder
(e.g. the .claude/launch.json "v10" server on :8740) and run with --pdf:
    python print/build.py --pdf
which prints http://localhost:8740/print/booklet.html to ngondro/<PDF_NAME>.

Text follows the source booklet (Ngondro_Daily_Practice_Karma_Kagyu-22-01-26-1.pdf,
compiled from Lama Rabsang's teachings, 2025). Design: "B · Clear and large".
"""
import html, pathlib, subprocess, sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
PDF_NAME = "four-thoughts-refuge-prostrations.pdf"
TITLE = "Four Thoughts, Refuge and Prostrations"

# Blocks: ("h", title) · ("sec", label[, number]) · ("p", phonetics, english) · ("note", text)
PAGES = [
    [("h", "Glory to the Root Lama"),
     ("p", "PALDEN TSAWAI LAMA RINPOCHE", "Glorious root-lama, precious one,"),
     ("p", "DAG GI CHIWOR PEH", "who crowns me"),
     ("p", "DAI DEN SHUG LA", "upon a lotus & moon-disc,"),
     ("p", "KAHDRIN CHENPUH GONEH JEZUNG TEH", "your great kindness"),
     ("p", "KU SUG TUG CHI NGODRUB TSALDU SOL", "grant the blessing conferring the accomplishment of body, speech & mind."),
     ("p", "PALDEN DORJE CHANG WANG", "Glorious Dorje Chang,"),
     ("p", "RIGKUN CHABDAG LAMA KARMAPA", "universal lord of all Buddha families, the Lama Karmapa,"),
     ("p", "CHILKHOR KUNJI JUNGNEH SISHI PALJUR YIDAM NALJORMA", "Yidam Dorje Naljorma, source of all mandalas,"),
     ("p", "TRINLEH KUNJI JEHPOR WANGJUR CHOCHONG BERCHEN CHAMDREL LA", "dharma protector Dorje Bernagchen and consort, powerful masters of all enlightened activity."),
     ("p", "NALJOR TSECHIG GUHPAE DUDO DRELMEH TUGJEH CHONGWAR DZUH", "The practitioner, with one-pointed devotion, bows down and requests to be inseparable from the protection of your compassion.")],

    [("h", "The Four Thoughts That Turn the Mind"), ("tight",),
     ("sec", "PRECIOUS LIFE", 1),
     ("p", "DANGPO GOMJA DALJOR RINCHEN DI", "Firstly, meditate on the precious eighteen conditions"),
     ("p", "TOBKAH JIGLA DARAY DUNYUH JA", "hard to obtain, easy to lose, which this time should be used with purpose."),
     ("sec", "IMPERMANENCE", 2),
     ("p", "NYIPA NUHCHU TAMCHEH MITAG CHING", "Secondly the entire universe and its contents are impermanent,"),
     ("p", "GUHSU DROWAI TSESOG CHUBUR DRA", "especially the life-force of sentient beings which is like a bubble."),
     ("p", "NAMCHI CHAMEH SHI TSE RORU JUR", "At the time of death, we die alone and one’s body becomes a corpse"),
     ("p", "DELA CHOCHI PENCHIR TSONPAE DRUB", "at that time only the dharma is of benefit, so practice with diligence."),
     ("sec", "KARMA, CAUSE AND EFFECT", 3),
     ("p", "SUMPA SHI TSE RANGWANG MINDU WAR", "Thirdly, at the time of death one’s freedom will be lost,"),
     ("p", "LEHNI DAG GIR JACHIR DIG PA PANG", "usurped by one’s karma; therefore, abandon defilements."),
     ("p", "GEWAI JAWAE TAGTU DAHWAR JA", "and accumulate virtue continuously until death."),
     ("p", "SHEHSAM NYIN REHRANG JU NYI LA TAG", "With this in mind, examine one’s motivation every day."),
     ("sec", "THE FAULTS OF SAMSARA", 4),
     ("p", "SHIPA KHORWAI NEHDRA DROG DEJOR SOG", "Fourthly, all places, friends, enjoyments, wealth and so on"),
     ("p", "DUG NGAL SUMJI TAGTU NARWAI CHIR", "continuously causes torment of the three sufferings,"),
     ("p", "SUHSAR TRIPAI SHEHMAI GAHTUN TAR", "instead of celebrating as the hangman leads you to your death,"),
     ("p", "SHENTRI CHEHNEH TSONPAE JANGCHUB DRUB", "cut through attachments and diligently strive for enlightenment"),
     ("note", "Allow a one to fifteen-minute contemplation of the four thoughts.")],

    [("h", "Visualisation, Taking Refuge and Bodhicitta"), ("tight",),
     ("p", "DUNDU TSO-U PAGSAM JUNSHING GI", "In front of one is a lake, and in its centre a wish-fulfilling tree"),
     ("p", "DONGPO TSAWA CHIGLA YELGA NGAR", "with a single trunk and five branches"),
     ("p", "JEHPAI U-MAR SENGTRI PEMA DANG", "in the centre where the branches divide is a lion-throne, a lotus,"),
     ("p", "NYIDAI TENGDU TSAWAI LA MANI", "a sun, a moon, upon which is one’s root-lama"),
     ("p", "DORJE CHANG LA KAHJU LAMAE KOR", "in the form of Dorje Chang, surrounded by the Kagyu lamas."),
     ("p", "DUNDU YIDAM YEHSU SANGJEH DANG", "In front are the Yidams, to the right the buddhas,"),
     ("p", "JABTU DAMCHO YUNDU GENDUN DANG", "behind the pure dharma, to the left the sangha,"),
     ("p", "DENTRI OGTU CHOCHONG SUNGMA NAM", "and below the throne are the host of dharma protectors and guardians,"),
     ("p", "SOSOI RIGTUN KHOR TSOK JAMTSUH KOR", "each surrounded by an ocean-like multitude of their kind."),
     ("p", "TSOTAH NEUSENG TENGDU KHACHAB CHI", "Beside the lake upon a verdant meadow and pervading the sky"),
     ("p", "MAGEN TAMCHEH KUHPAR JURPA LEH", "all of my previous mothers appear,"),
     ("p", "TSECHIG YICHI CHABDRO SEMCHEH JUR", "all of us one-pointedly resolved on taking refuge."),
     ("sec", "TAKING REFUGE"),
     ("p", "DAGDANG NAMKHAI TAHDANG NYAMPAI SEMCHEN", "I and all sentient beings throughout the universe take refuge in the embodiment,"),
     ("p", "TAMCHEH CHOGCHU DUSUM JI DESHIN SHEGPA TAMCHEH CHI KU SUNG TUG YONTEN TRINLEH TAMCHEH CHIGTU DUHPAI NGOWOR JUR PA", "the very essence of the body, speech, mind, activity, and quality of all of the Buddhas of the ten directions and the three times,"),
     ("p", "CHOCHI PUNGPO TONGTRAG JEHCHU TSA SHI JUNGNEH", "source of the eighty-four thousand dharma collection,"),
     ("p", "PAGPAI GENDUN TAMCHEH CHI NGAH DAG", "the master of all the noble Sangha,"),
     ("p", "DRINCHEN TSAWA DANG JUHPAR CHEHPAI", "the kind root and lineage ones;")],

    [("h", "Recite During Prostrations"), ("big",),
     ("p", "PALDEN LAMA DAMPA NAMLA CHABSU CHIO", "In the glorious lamas, the superior ones, I take refuge"),
     ("p", "YIDAM CHILKHOR JI LHA TSOK NAMLA CHABSU CHIO", "In the host of Yidams, the deities of the mandalas, I take refuge"),
     ("p", "SANGJEH CHOM DENDEH NAMLA CHABSU CHIO", "In the victorious Buddhas, I take refuge."),
     ("p", "DAMPAI CHO NAMLA CHABSU CHIO", "In the pure dharma I take refuge."),
     ("p", "PAGPAI GENDUN NAMLA CHABSU CHIO", "In the exalted sangha I take refuge."),
     ("p", "PAHWO KHANDRO CHOCHONG SUNGMAI TSOG YESHE CHI CHENDANG DENPA NAMLA CHABSU CHIO", "In the host of deities possessing the wisdom-eye, the dakas, dakinis, dharma protectors and guardians, I take refuge."),
     ("note", "Repeat seven, twenty-one, or as many times as one can.")],

    [("h", "Bodhisattva Vow"),
     ("p", "JANGCHUB NYINGPOR CHICHI BAR", "Until the heart of enlightenment is realised"),
     ("p", "SANGJEH NAMLA CHABSU CHIO", "I take refuge in the Buddhas,"),
     ("p", "CHO DANG JANGCHUB SEMPAH YI", "in the dharma and bodhisattvas"),
     ("p", "TSOG LA-ANG DESHIN CHABSU CHIO", "the host of realized ones, I take refuge."),
     ("p", "JITAR NGONJI DESHEG CHI", "Just as the realized ones of the past"),
     ("p", "JANGCHUB TUGNI CHEHPA DANG", "engendered the enlightenment-heart"),
     ("p", "JANGCHUB SEMPAI LABPA LA", "and the bodhisattva training"),
     ("p", "DEHDAG RIMSHIN NEHPA TAR", "through their successive levels,"),
     ("p", "DESHIN DRO LA PENDUN DU", "likewise, for the benefit of all sentient beings"),
     ("p", "JANGCHUB SEMNI CHEHJI SHING", "I will generate bodhicitta"),
     ("p", "DESHIN DUNI LABPA LA-ANG", "and in the same way train,"),
     ("p", "RIMPA SHINDU LABPAR JI", "throughout the succeeding levels."),
     ("note", "Repeat three times.")],

    [("sec", "TO UPLIFT ONESELF"),
     ("p", "DENGDUH DAGTSE DREBU YUH", "From today my life has become fruitful"),
     ("p", "MIYI SIPA LEGPAR TOB", "my human life has become worthy"),
     ("p", "DERING SANGJEH RIGSU CHEH", "today I have been born into the Buddha’s family"),
     ("p", "SANGJEH SEHSU DAG DENG JUR", "from today I become a child of Buddha."),
     ("p", "DANI DAG GI CHINAY CHANG", "In the future I will always"),
     ("p", "RIGDANG TUNPAI LEH TSAM TEH", "behave in accordance with this association"),
     ("p", "CHUNMEH TSUNPAI RIGDI LA", "so that our noble, faultless family"),
     ("p", "NYOGPAR MIN JUR DEHTAR JA", "remains undefiled."),
     ("sec", "OTHER PRAISES"),
     ("p", "DAG GI DERING CHOBPA TAMCHEH CHI", "I, today, before the entire refuge"),
     ("p", "CHEN NGAR DROWA DESHEG NYIDANG NI", "invite all beings to attain enlightenment"),
     ("p", "BARDU DEHLA DRONDU BUHZIN JI", "and until then enjoy happiness"),
     ("p", "LHA DANG LHAMIN LASOG GAHWAR JI", "thus gods & mortals, and so on, rejoice.")],

    [("h", "Bodhicitta Aspiration Prayers"),
     ("p", "JANGCHUB SEMNI RINPOCHE", "May the precious bodhicitta"),
     ("p", "MACHEH PA NAM CHEHJUR CHIG", "take birth where it is not existing,"),
     ("p", "CHEHPA NYAMPA MEHPA DANG", "where it exists may it never wane"),
     ("p", "GONGNEH GONGDU PELWAR SHOG", "but continuously increase."),
     ("p", "JANGCHUB SEMDANG MI DREL SHING", "May we be inseparable from bodhicitta"),
     ("p", "JANGCHUB CHUHLA SHOL WA DANG", "may bodhisattva conduct be diligently engaged."),
     ("p", "SANGJEH NAMCHI YONG ZUNG SHING", "Through the Buddhas accomplishments,"),
     ("p", "DUCHI LEHNAM PONGWAR SHOG", "may those with harmful intent be repelled."),
     ("p", "JANGCHUB SEMPAH NAMCHI NI", "May all of the bodhisattvas"),
     ("p", "DRODUN TUGLA GONG DRUB SHOG", "fulfil their objectives for the benefit of others,"),
     ("p", "GONPO YINI GANG GONG PA", "and through their all-enfolding protection"),
     ("p", "SEMCHEN NAMLA DEJOR SHOG", "may all sentient beings have abundant happiness."),
     ("p", "SEMCHEN TAMCHEH DEDANG DENJUR CHIG", "May all sentient beings have happiness"),
     ("p", "NGENDRO TAMCHEH TAGTU TONGPAR SHOG", "may all the lower realms be empty forever,"),
     ("p", "JANGCHUB SEMPAH GANGDAG SAR SHUGPA", "may the bodhisattvas fulfil their objectives,"),
     ("p", "DEYDAG KUNJI MONLAM DRUBPAR SHOG", "and in this way may all the aspiration prayers be fulfilled.")],

    [("h", "The Four Limitless Thoughts"),
     ("p", "SEMCHEN TAMCHEH DEWA DANG, DEWAI JUDANG DENPAR JUR CHIG", "May all sentient beings have happiness and the causes of happiness,"),
     ("p", "DUG NGAL DANG, DUG NGALJI JUDANG DRELWAR JUR CHIG", "may they be free from suffering and the causes of suffering,"),
     ("p", "DUG NGAL MEHPAI DEWA DAMPA DANG MIDRELWAR JUR CHIG", "may they be inseparable from the joy-beyond-suffering"),
     ("p", "NYERING CHAGDANG NYI DANG DRELWAI TANG NYOM CHENPO LA NEHPAR JURCHIG", "may they remain in the great equanimity beyond attachment or aversion."),
     ("note", "Repeat three times."),
     ("gap",),
     ("p", "TAHMAR CHABYUL O-SHU DAGDANG DREH", "Lastly the source of refuge melts into light which merges with me.")],

    [("h", "Dedication and Aspiration"),
     ("p", "GEDI DROWA MALU DORJE SEM", "Through this merit may all sentient beings without exception become vajra beings,"),
     ("p", "TAGDEI TABSHEH JORWAE CHIMEH CHI", "the permanent bliss of means and wisdom, united eternally,"),
     ("p", "NANG GI LAMNEH DORJER DROWA YI", "and may beings, by travelling the vajra inner path"),
     ("p", "SANGJEH NYICHI GO PANG TSOL CHIR NGO", "attain the level of the Buddha itself – to that end I dedicate."),
     ("p", "GEWA DIYI NYURDU DAG", "Through this merit may I quickly"),
     ("p", "CHAGJA CHENPO DRUBJUR NEH", "gain the accomplishment of Mahamudra,"),
     ("p", "DROWA CHIG CHANG MALU PA", "that I may lead all sentient beings without exception"),
     ("p", "DEYI SALA GUH PAR SHOG", "to that level, may it be so!"),
     ("p", "SANGJEH KUSUM NYEHPAI JINLAB DANG", "Through the blessings of the three bodies of the buddhas,"),
     ("p", "CHONYI MINJUR DENPAI JINLAB DANG", "through the blessings of the unchanging truth of the Dharmata,"),
     ("p", "GEN DUN MICHEH DUNPAI JINLAB CHI", "through the blessings of the pure aspirations of the undiminished sangha,"),
     ("p", "JITAR NGOWA MONLAM DRUBPAR SHOG", "may the aspirations and dedications be realized."),
     ("p", "DECHEN TSOKJI KHORLOR TAG ROLPA", "You who continuously turn the wheel of the accumulation of great bliss,"),
     ("p", "DUSUM JAL WAI TERCHEN KARMAPA", "great treasure revealer of the Buddhas of the three times, Karmapa,"),
     ("p", "YABSEH JUPAR CHEHPA SI TSO DIR", "the lineage holders and followers, in this ocean of samsara"),
     ("p", "KALPA KALPAI BARDU SHABTEN SOL", "please remain for Aeon upon Aeon.")],

    [("p", "GANG GI ZABSANG SUNG GI SANGWA LA", "The secret holders of the profound secret teachings,"),
     ("p", "TUHSAM DRUBPA NYINGPOR JERPA YI", "through listening, reflecting and practicing you have taken them to your heart,"),
     ("p", "PONG DANG LOGPAI DENAM TAMCHEY NI", "may all the gatherings of hermits and scholars"),
     ("p", "YARJI CHUWO TABUR JEH JUR CHIG", "increase like rivers in the rainy season."),
     ("p", "PALDEN LAMA SHABPAY TENPA DANG", "May the glorious lamas remain steadfast on their lotus-feet (i.e. live long),"),
     ("p", "KHA NYAM YONGLA DECHI JUNGWA DANG", "may bliss and happiness spread far and wide like the sky."),
     ("p", "DAGSHEN MALU TSOG SAG DRIB JANG NEH", "May I and all sentient beings amass our accumulations, purify our obscurations,"),
     ("p", "NYURDU SANGJEH SALA GUHPAR SHOG", "quickly being established at the level of the buddhas."),
     ("close",
      "By the virtue of seeing, hearing, remembering, or touching this text, may all sentient beings take birth in the pure land of great bliss!",
      "May the auspicious Karma Kagyu teachings, blazing with splendour, increase throughout the ten directions as the ornament of the world.",
      "May all be auspicious!",
      "Happiness! Happiness! Happiness!")],
]

E = html.escape


def block(b):
    k = b[0]
    if k == "h":
        return f'<h2>{E(b[1])}</h2>'
    if k == "sec":
        num = f'<span class="num">{b[2]}</span>' if len(b) > 2 else ''
        return f'<div class="sec">{num}<span class="lab">{E(b[1])}</span></div>'
    if k == "p":
        return f'<div class="pair"><p class="ph">{E(b[1])}</p><p class="en">{E(b[2])}</p></div>'
    if k == "note":
        return f'<p class="note">{E(b[1])}</p>'
    if k == "gap":
        return '<div class="gap"></div>'
    if k == "close":
        return '<div class="close">' + ''.join(f'<p>{E(x)}</p>' for x in b[1:]) + '</div>'
    return ''


def page(blocks, n):
    flags = [b[0] for b in blocks if b[0] in ("big", "tight")]
    body = ''.join(block(b) for b in blocks if b[0] not in ("big", "tight"))
    return (f'<section class="page{"".join(" " + f for f in flags)}"><div class="rh"><span>{E(TITLE)}</span><span>Ngöndro daily practice</span></div>'
            f'{body}<p class="pn">{n}</p></section>')


COVER = f'''<section class="page cover">
<div class="kicker"><span lang="bo" class="tib">སྔོན་འགྲོ།</span><span>NGÖNDRO DAILY PRACTICE</span></div>
<h1>{E(TITLE)}</h1>
<p class="sub">Instructions on the one hundred and eleven thousand prostrations, for removing obstacles of body, speech and mind</p>
<p class="trad">Karma Kagyu tradition · For the benefit of all beings</p>
<div class="art"><img src="../ngondro/refuge-tree.jpg" alt="The Karma Kagyu refuge tree"></div>
</section>'''

LAST = '''<section class="page tree">
<div class="art"><img src="../ngondro/refuge-tree.jpg" alt="The Karma Kagyu refuge tree"></div>
<p class="cap">The Karma Kagyu refuge tree</p>
<p class="colophon">Unofficially compiled from teachings beautifully given by Lama Rabsang in 2025.<br>May his words send ripples of love and awakening throughout the ten directions and three times.</p>
</section>'''

CSS = '''
@font-face{font-family:'Atkinson Hyperlegible Next';font-weight:200 800;src:url(../ngondro/fonts/atkinson-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Atkinson Hyperlegible Next';font-weight:200 800;src:url(../ngondro/fonts/atkinson-latin-ext.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1E00-1E9F}
@font-face{font-family:'Noto Serif Tibetan';font-weight:400 700;src:url(../ngondro/fonts/noto-serif-tibetan.woff2) format('woff2');unicode-range:U+0F00-0FFF}
@page{size:A4;margin:0}
*{box-sizing:border-box}
html,body{margin:0;background:#8a8378}
body{font-family:'Atkinson Hyperlegible Next',system-ui,sans-serif;color:#1f1812;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:210mm;height:297mm;margin:24px auto;padding:52px 72px 56px;background:#fffdf8;position:relative;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 4px 20px rgba(0,0,0,.25)}
@media print{html,body{background:#fffdf8}.page{margin:0;box-shadow:none;break-after:page}}
.rh{display:flex;justify-content:space-between;align-items:baseline;padding-bottom:10px;border-bottom:1px solid #d9ccb4;font-size:13px;color:#5c4e40;margin-bottom:8px}
h2{margin:16px 0 6px;font-weight:700;font-size:32px;line-height:1.15;letter-spacing:-.3px}
.sec{display:flex;align-items:center;gap:10px;margin:18px 0 6px}
.num{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fffdf8;background:#a8550f}
.lab{font-size:14px;font-weight:700;letter-spacing:1.4px;color:#4a3d31}
.pair{margin-top:10px;break-inside:avoid}
.ph{margin:0;font-size:14px;line-height:1.3;font-weight:700;letter-spacing:.6px;color:#a8550f}
.en{margin:2px 0 0;font-size:17px;line-height:1.35}
.note{margin:18px 0 0;font-size:15px;font-style:italic;color:#4a3d31}
.gap{height:22px}
.tight .pair{margin-top:6px}
.tight .en{font-size:16px}
.tight .sec{margin:12px 0 2px}
.tight h2{margin-top:10px}
.big .pair{margin-top:30px}
.big .ph{font-size:27px;letter-spacing:.6px;line-height:1.25}
.big .en{font-size:21px;margin-top:6px}
.big .note{font-size:18px;margin-top:30px}
.close{margin-top:auto;padding-top:22px;border-top:1px solid #d9ccb4;text-align:center;font-size:15px;line-height:1.45;color:#4a3d31}
.close p{margin:0 0 8px}
.pn{position:absolute;right:72px;bottom:26px;margin:0;font-size:13px;font-weight:700;color:#5c4e40}
.cover{padding:80px 72px 56px}
.kicker{display:flex;align-items:center;gap:14px;font-size:15px;font-weight:700;letter-spacing:1.5px;color:#a8550f}
.tib{font-family:'Noto Serif Tibetan',serif;font-size:26px;letter-spacing:0;line-height:1.4;font-weight:500}
h1{margin:26px 0 0;font-weight:700;font-size:60px;line-height:1.04;letter-spacing:-1px}
.sub{margin:20px 0 0;font-size:20px;line-height:1.45;color:#4a3d31;max-width:560px}
.trad{margin:18px 0 0;font-size:17px;font-weight:700;color:#4a3d31}
.art{flex:1;min-height:0;position:relative;margin-top:28px}
.art img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block}
.tree{padding:56px 72px 48px}
.tree .art{margin-top:0}
.cap{margin:14px 0 0;text-align:center;font-size:15px;font-weight:700;color:#4a3d31}
.colophon{margin:22px 0 0;text-align:center;font-size:14px;line-height:1.5;color:#4a3d31;font-style:italic}
'''


def build():
    pages = [COVER] + [page(p, i + 2) for i, p in enumerate(PAGES)] + [LAST]
    doc = (f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{E(TITLE)}</title>'
           f'<style>{CSS}</style></head><body>{"".join(pages)}</body></html>')
    (HERE / "booklet.html").write_text(doc, encoding="utf-8")
    print(f"booklet.html: {len(pages)} pages")


def pdf(url="http://localhost:8740/print/booklet.html"):
    exe = next(p for p in [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                           r"C:\Program Files\Google\Chrome\Application\chrome.exe"] if pathlib.Path(p).exists())
    out = ROOT / "ngondro" / PDF_NAME
    out.unlink(missing_ok=True)
    import tempfile, time
    with tempfile.TemporaryDirectory() as prof:  # own profile, so an open browser window doesn't swallow the job
        subprocess.run([exe, "--headless=new", "--disable-gpu", "--no-first-run", f"--user-data-dir={prof}",
                        "--no-pdf-header-footer", "--virtual-time-budget=8000",
                        f"--print-to-pdf={out}", url], check=True, timeout=120)
        # Edge can return before the file is written: wait until it exists and stops growing.
        last = -1
        for _ in range(120):
            time.sleep(1)
            size = out.stat().st_size if out.exists() else -1
            if size > 0 and size == last:
                break
            last = size
    print("wrote", out, out.stat().st_size, "bytes")


if __name__ == "__main__":
    build()
    if "--pdf" in sys.argv:
        pdf()
