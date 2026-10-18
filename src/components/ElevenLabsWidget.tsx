import { useEffect } from 'react';

const SCRIPT_SRC = 'https://unpkg.com/@elevenlabs/convai-widget-embed';

const ElevenLabsWidget = ({ agentId }: { agentId: string }) => {
  useEffect(() => {
    const id = agentId.trim();
    if (!id) return;

    if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.type = 'text/javascript';
      document.body.appendChild(script);
    }

    const widget = document.createElement('elevenlabs-convai');
    widget.setAttribute('agent-id', id);
    document.body.appendChild(widget);

    return () => {
      widget.remove();
    };
  }, [agentId]);

  return null;
};

export default ElevenLabsWidget;
