import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { siteConfig } from './config/site'

// Update document title and meta tags from config
document.title = siteConfig.seo.title;

// Update or create meta tags
const updateMetaTag = (name: string, content: string, property = false) => {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let meta = document.querySelector(selector);
  if (!meta) {
    meta = document.createElement('meta');
    if (property) {
      meta.setAttribute('property', name);
    } else {
      meta.setAttribute('name', name);
    }
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
};

updateMetaTag('description', siteConfig.seo.description);
updateMetaTag('keywords', siteConfig.seo.keywords);
updateMetaTag('author', siteConfig.seo.author);
updateMetaTag('og:title', siteConfig.seo.title, true);
updateMetaTag('og:description', siteConfig.seo.description, true);
updateMetaTag('og:type', siteConfig.seo.og.type, true);
updateMetaTag('og:url', siteConfig.urls.productionUrl, true);
updateMetaTag('og:image', siteConfig.seo.og.image, true);
updateMetaTag('twitter:card', siteConfig.seo.twitter.card);
updateMetaTag('twitter:site', siteConfig.seo.twitter.site);
updateMetaTag('twitter:image', siteConfig.seo.og.image);

// Load ElevenLabs widget if enabled
if (siteConfig.integrations.elevenlabs.enabled) {
  const container = document.getElementById('elevenlabs-widget-container');
  if (container) {
    const widget = document.createElement('elevenlabs-convai');
    widget.setAttribute('agent-id', siteConfig.integrations.elevenlabs.agentId);
    container.appendChild(widget);
    
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';
    document.body.appendChild(script);
  }
}

createRoot(document.getElementById("root")!).render(<App />);
