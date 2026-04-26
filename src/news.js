export async function initNewsFeed() {
  const container = document.getElementById('newsFeed');
  if (!container) return;

  // Split queries to bypass 10-item limit on rss2json without hitting blocked scrapers
  const queries = [
    'Sporting+SAD+finanças+OR+CMVM',
    'Sporting+SAD+mercado+OR+transferências+OR+contratações',
    'Sporting+SAD+negócio+OR+patrocínio',
    'Sporting+SAD+relatório+OR+contas',
    'Sporting+SAD+ações+OR+bolsa'
  ];

  try {
    const responses = await Promise.all(
      queries.map(q => {
        const url = encodeURIComponent(`https://news.google.com/rss/search?q=${q}&hl=pt-PT&gl=PT&ceid=PT:pt-150`);
        return fetch(`https://api.rss2json.com/v1/api.json?rss_url=${url}`).then(r => r.json()).catch(() => ({ items: [] }));
      })
    );
    
    // Tag each item with a category based on the query it came from
    const FinItems1 = (responses[0].items || []).map(i => ({ ...i, category: 'FINANCE' }));
    const mktItems = (responses[1].items || []).map(i => ({ ...i, category: 'MARKET' }));
    const corpItems1 = (responses[2].items || []).map(i => ({ ...i, category: 'CORPORATE' }));
    const FinItems2 = (responses[3].items || []).map(i => ({ ...i, category: 'FINANCE' }));
    const FinItems3 = (responses[4].items || []).map(i => ({ ...i, category: 'FINANCE' }));

    let dataItems = [...FinItems1, ...mktItems, ...corpItems1, ...FinItems2, ...FinItems3];

    if (dataItems.length > 0) {
      container.innerHTML = ''; // Clear loading text
      
      // Filter out irrelevant sports noise (e.g. youth teams, B team, futsal, generic match scores)
      // And filter out historic re-index glitches (e.g. Rui Patrício, Bruno de Carvalho, Jesus)
      let filteredItems = dataItems.filter(item => {
        const t = item.title.toLowerCase();
        if (t.includes('equipa b') || t.includes('futsal') || t.includes('andebol') || t.includes('hóquei') || t.includes('sub-')) return false;
        if (t.includes('rui patrício') || t.includes('bruno de carvalho') || t.includes('jorge jesus') || t.includes('bas dost')) return false;
        if (t.includes('benfica') || t.includes('porto') || t.includes('fcp') || t.includes('slb')) return false;
        return true;
      });

      // Process all items to extract sourceName cleanly
      const processedItems = filteredItems.map(item => {
        let sourceName = item.category === 'OFFICIAL' ? 'Sporting CP' : 'Notícias';
        if (item.title && item.title.includes(' - ')) {
          const parts = item.title.split(' - ');
          sourceName = parts.pop();
          item.title = parts.join(' - ');
        } else if (item.author) {
          sourceName = item.author;
        }
        return { ...item, sourceName };
      });

      // Cluster news from the same topic
      const storyClusters = [];
      const stopWords = new Set(['sporting', 'sad', 'cmvm', 'sobre', 'novo', 'nova', 'mais', 'como', 'pelo', 'pela']);
      
      for (const item of processedItems) {
        const words = item.title.toLowerCase().split(/[\s\W]+/).filter(w => w.length > 3 && !stopWords.has(w));
        
        let addedToCluster = false;
        for (const cluster of storyClusters) {
          const existingWords = cluster.primary.title.toLowerCase().split(/[\s\W]+/).filter(w => w.length > 3 && !stopWords.has(w));
          let overlap = 0;
          for (const w of words) {
            if (existingWords.includes(w)) overlap++;
          }
          // If they share 3 or more significant words, they are likely the same topic
          if (overlap >= 3) {
            // Only add to sources if this specific source isn't already there
            if (!cluster.sources.find(s => s.sourceName === item.sourceName)) {
              cluster.sources.push(item);
            }
            addedToCluster = true;
            break;
          }
        }
        if (!addedToCluster) {
          storyClusters.push({ primary: item, sources: [item] });
        }
      }

      if (storyClusters.length === 0) {
        container.innerHTML = `<div class="news-loading">No recent corporate updates found.</div>`;
        return;
      }

      // Sort clusters by date of the primary article descending
      storyClusters.sort((a, b) => {
        const da = new Date(a.primary.pubDate ? a.primary.pubDate.replace(' ', 'T') + 'Z' : 0);
        const db = new Date(b.primary.pubDate ? b.primary.pubDate.replace(' ', 'T') + 'Z' : 0);
        return db - da;
      });

      // Show up to 18 clusters (6 rows of 3 on desktop)
      storyClusters.slice(0, 18).forEach((cluster, index) => {
        const item = cluster.primary;

        const card = document.createElement('div');
        let classes = ['news-card'];
        if (index === 0) classes.push('hero-card');
        if (item.category) classes.push(`category-${item.category.toLowerCase()}`);
        card.className = classes.join(' ');

        // Badge
        if (item.category) {
          const badge = document.createElement('span');
          badge.className = `news-badge badge-${item.category.toLowerCase()}`;
          badge.textContent = item.category;
          card.appendChild(badge);
        }

        const title = document.createElement('h3');
        title.className = 'news-title';
        title.textContent = item.title;
        card.appendChild(title);

        const date = document.createElement('div');
        date.className = 'news-date';
        if (item.pubDate) {
          const d = new Date(item.pubDate.replace(' ', 'T') + 'Z');
          if (!isNaN(d.getTime())) {
            date.textContent = d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
          } else {
            date.textContent = 'Recent';
          }
        } else {
          date.textContent = 'Recent';
        }
        card.appendChild(date);
        
        // Render Source Pills
        const sourcesContainer = document.createElement('div');
        sourcesContainer.className = 'news-sources-list';
        
        cluster.sources.forEach(sourceItem => {
          const pill = document.createElement('a');
          pill.className = 'source-pill';
          pill.href = sourceItem.link;
          pill.target = '_blank';
          // Removed noopener noreferrer to allow Google News redirects
          pill.textContent = sourceItem.sourceName;
          sourcesContainer.appendChild(pill);
        });
        
        card.appendChild(sourcesContainer);

        container.appendChild(card);
      });
    } else {
      throw new Error('No items found or feed is empty.');
    }
  } catch (error) {
    console.error('Failed to load news feed:', error);
    container.innerHTML = `
      <div class="news-loading" style="color: var(--neg);">
        Error: ${error.message}
      </div>
    `;
  }
}
