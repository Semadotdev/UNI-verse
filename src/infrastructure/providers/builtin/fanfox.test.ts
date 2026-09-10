import { describe, expect, it } from 'vitest';
import { MangaStatus } from '@/domain/entities/manga';
import { decodeImageUrls } from './fanfox/packer';
import {
  buildSearchUrl,
  orderSearchResults,
  parseChapterList,
  parseMangaDetails,
  parseMangaList,
} from './fanfox';

const PACKED_SAMPLE = `eval(function(p,a,c,k,e,d){e=function(c){return(c<a?"":e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)d[e(c)]=k[c]||e(c);k=[function(e){return d[e]}];e=function(){return'\\\\w+'};c=1;};while(c--)if(k[c])p=p.replace(new RegExp('\\\\b'+e(c)+'\\\\b','g'),k[c]);return p;}('u f(){2 k="//8.9.a/c/5/4/7-3.0/h";2 1=["/e-m.g?j=n&b=6","/e-3.g?j=l&b=6"];o(2 i=0;i<1.t;i++){s(i==0){1[i]="//8.9.a/c/5/4/7-3.0/h"+1[i];p}1[i]=k+1[i]}q 1}2 d;d=f();r=0;',31,31,'|pvalue|var|001|106|manga|1789056000|01|zjcdn|mangafox|me|ttl|store||uone_piece_v001|dm5imagefun|jpg|compressed||token|pix|423291db15813fa60340b93798faa10cb66290bb|000|1163d8172cfe03c63c1a22bd9998193b88804bb4|for|continue|return|currentimageid|if|length|function'.split('|'),0,{}))`;

describe('buildSearchUrl', () => {
  it('uses the title query param, lowercases, and encodes the query', () => {
    expect(buildSearchUrl('Magic Emperor', 2)).toBe(
      'https://newm.fanfox.net/search?title=magic%20emperor&page=2'
    );
  });

  it('defaults to page 1 and trims whitespace', () => {
    expect(buildSearchUrl('  One Piece  ')).toBe(
      'https://newm.fanfox.net/search?title=one%20piece&page=1'
    );
  });
});

describe('orderSearchResults', () => {
  const items = (titles: string[]) => titles.map((title) => ({ title }));

  it('pins the exact case-insensitive title match first', () => {
    const out = orderSearchResults(items(['Magical Chocolate', 'Magic Emperor', 'Brilliant Magic']), 'magic emperor');
    expect(out.map((m) => m.title)).toEqual(['Magic Emperor', 'Brilliant Magic', 'Magical Chocolate']);
  });

  it('orders remaining items alphabetically, deterministically', () => {
    const out = orderSearchResults(items(['Zero', 'Alpha', 'Beta']), 'gamma');
    expect(out.map((m) => m.title)).toEqual(['Alpha', 'Beta', 'Zero']);
  });

  it('does not mutate the input array', () => {
    const input = items(['b', 'a']);
    orderSearchResults(input, 'b');
    expect(input.map((m) => m.title)).toEqual(['b', 'a']);
  });
});

describe('decodeImageUrls', () => {
  it('unpacks the Dean Edwards packed reader payload into image urls', () => {
    const urls = decodeImageUrls(PACKED_SAMPLE);
    expect(urls).toHaveLength(2);
    expect(urls[0]).toBe(
      'https://zjcdn.mangafox.me/store/manga/106/01-001.0/compressed/uone_piece_v001-000.jpg?token=1163d8172cfe03c63c1a22bd9998193b88804bb4&ttl=1789056000'
    );
    expect(urls[1]).toBe(
      'https://zjcdn.mangafox.me/store/manga/106/01-001.0/compressed/uone_piece_v001-001.jpg?token=423291db15813fa60340b93798faa10cb66290bb&ttl=1789056000'
    );
  });

  it('rejects unrecognized payloads', () => {
    expect(() => decodeImageUrls('not a packed script')).toThrow();
  });
});

describe('parseMangaList', () => {
  it('parses search/release card items into manga', () => {
    const html = `<ul class="manga-list-2">
      <li>
        <div class="manga-list-2-cover">
          <a href="/manga/magic_emperor/" title="Magic Emperor">
            <img class="manga-list-2-cover-img" src="https://fmcdn.mfcdn.net/store/manga/11/cover.jpg?token=b" alt="Magic Emperor">
          </a>
        </div>
        <p class="manga-list-2-title"><a href="/manga/magic_emperor/" title="Magic Emperor">Magic Emperor</a></p>
      </li>
      <li>
        <div class="manga-list-2-cover">
          <a href="/manga/666_satan/" title="666 Satan">
            <img class="manga-list-2-cover-img" src="https://fmcdn.mfcdn.net/store/manga/13/cover.jpg?token=c" alt="666 Satan">
          </a>
        </div>
        <p class="manga-list-2-title"><a href="/manga/666_satan/" title="666 Satan">666 Satan</a></p>
      </li>
    </ul>`;

    const items = parseMangaList(html, 'fanfox');
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      id: 'magic_emperor',
      providerId: 'fanfox',
      title: 'Magic Emperor',
      cover: 'https://fmcdn.mfcdn.net/store/manga/11/cover.jpg?token=b',
    });
    expect(items[0].status).toBe(MangaStatus.UNKNOWN);
    expect(items[1].id).toBe('666_satan');
  });

  it('parses ranking cards rendered as manga-list-2', () => {
    const html = `<ul class="manga-list-2">
      <li>
        <div class="manga-list-2-cover">
          <a href="/manga/onepunch_man/" title="Onepunch-Man">
            <img class="manga-list-2-cover-img" src="https://fmcdn.mfcdn.net/store/manga/11362/cover.jpg?token=t" alt="Onepunch-Man">
          </a>
        </div>
        <p class="manga-list-2-title"><a href="/manga/onepunch_man/" title="Onepunch-Man">Onepunch-Man</a></p>
      </li>
    </ul>`;

    const items = parseMangaList(html, 'fanfox');
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 'onepunch_man', title: 'Onepunch-Man' });
  });

  it('skips list items without a manga link', () => {
    const html = `<ul class="manga-list-2"><li><p>ad placeholder</p></li></ul>`;
    expect(parseMangaList(html, 'fanfox')).toHaveLength(0);
  });

  it('deduplicates titles listed once per released chapter', () => {
    const html = `<ul class="manga-list-2">
      <li>
        <div class="manga-list-2-cover">
          <a href="/manga/yami_no_aegis/" title="Yami no Aegis">
            <img class="manga-list-2-cover-img" src="//fmcdn.mfcdn.net/store/manga/5/cover.jpg?token=1" alt="Yami no Aegis">
          </a>
        </div>
        <p class="manga-list-2-title"><a href="/manga/yami_no_aegis/" title="Yami no Aegis">Yami no Aegis</a></p>
      </li>
      <li>
        <div class="manga-list-2-cover">
          <a href="/manga/yami_no_aegis/" title="Yami no Aegis">
            <img class="manga-list-2-cover-img" src="//fmcdn.mfcdn.net/store/manga/5/cover.jpg?token=2" alt="Yami no Aegis">
          </a>
        </div>
        <p class="manga-list-2-title"><a href="/manga/yami_no_aegis/" title="Yami no Aegis">Yami no Aegis</a></p>
      </li>
      <li>
        <div class="manga-list-2-cover">
          <a href="/manga/heart_pounding_planet/" title="Heart Pounding Planet">
            <img class="manga-list-2-cover-img" src="//fmcdn.mfcdn.net/store/manga/9/cover.jpg?token=3" alt="Heart Pounding Planet">
          </a>
        </div>
        <p class="manga-list-2-title"><a href="/manga/heart_pounding_planet/" title="Heart Pounding Planet">Heart Pounding Planet</a></p>
      </li>
    </ul>`;

    const items = parseMangaList(html, 'fanfox');
    expect(items).toHaveLength(2);
    expect(items.map((m) => m.id)).toEqual(['yami_no_aegis', 'heart_pounding_planet']);
    expect(items[0].cover).toBe('https://fmcdn.mfcdn.net/store/manga/5/cover.jpg?token=1');
  });
});

describe('parseMangaDetails', () => {
  it('parses title, cover, genres, authors, description, and last update', () => {
    const html = `<div class="detail-top-bar">
  <div class="detail-top-bar-cover">
    <img class="detail-top-bar-cover-img" src="//fmcdn.mfcdn.net/store/manga/106/cover.jpg?token=x&amp;ttl=y" alt="One Piece">
  </div>
  <div class="detail-top-bar-info">
    <p class="detail-top-bar-info-title">One Piece</p>
    <p class="detail-top-bar-info-star"><img class="item-star" src="//static.fanfox.net/v202602274/mangafoxmobile/images/star-10.png"></p>
    <p class="detail-top-bar-info-update">Last Update: Sep 04,2026</p>
  </div>
</div>
<div class="white-bg">
  <div class="detail-tag-bar"><span>Tag：</span>
    <a href="/directory/action/" title="Action">Action</a>
    <a href="/directory/comedy/" title="Comedy">Comedy</a>
  </div>
  <div class="detail-author-bar"><span>Author：</span>
    <a href="/search/author/ODA+Eiichiro/" title="ODA Eiichiro">ODA Eiichiro</a>
  </div>
  <div class="detail-text-bar"><p>Gol D. Roger was known as the Pirate King.</p></div>
</div>`;

    const manga = parseMangaDetails(html, 'one_piece', 'fanfox');
    expect(manga).toMatchObject({
      id: 'one_piece',
      providerId: 'fanfox',
      title: 'One Piece',
      cover: 'https://fmcdn.mfcdn.net/store/manga/106/cover.jpg?token=x&ttl=y',
      status: MangaStatus.UNKNOWN,
      genres: ['Action', 'Comedy'],
      authors: ['ODA Eiichiro'],
      description: 'Gol D. Roger was known as the Pirate King.',
    });
    expect(manga.lastUpdate?.getFullYear()).toBe(2026);
    expect(manga.lastUpdate?.getMonth()).toBe(8);
  });

  it('leaves lastUpdate null when no update label is present', () => {
    const html = `<div class="detail-top-bar-info"><p class="detail-top-bar-info-title">X</p></div>`;
    const manga = parseMangaDetails(html, 'x', 'fanfox');
    expect(manga.lastUpdate).toBeNull();
  });
});

describe('parseChapterList', () => {
  it('parses flat chapter anchors including hidden volume blocks', () => {
    const html = `<div id="chapterlist">
  <div id="list-1"><div class="detail-chapters-list">
    <a href="/manga/one_piece/c1046.5/1.html" title="One Piece Ch.1046.5" > Ch.1046.5 </a>
  </div></div>
  <div id="list-3" style="display:none"><div class="detail-chapters-list">
    <a href="/manga/one_piece/vTBE/c1192/1.html" title="One Piece Vol.TBE Ch.1192" > Vol.TBE Ch.1192 </a>
  </div></div>
</div>`;

    const chapters = parseChapterList(html, 'one_piece');
    expect(chapters).toHaveLength(2);

    expect(chapters[0]).toMatchObject({
      id: 'one_piece/c1046.5',
      mangaId: 'one_piece',
      number: 1046.5,
      title: 'Ch.1046.5',
      scanlationGroup: null,
      uploadDate: null,
    });

    expect(chapters[1]).toMatchObject({
      id: 'one_piece/vTBE/c1192',
      mangaId: 'one_piece',
      number: 1192,
      title: 'Vol.TBE Ch.1192',
      scanlationGroup: null,
      uploadDate: null,
    });
  });
});