import { useEffect, useRef, useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface AutoPlayVideoProps {
  url: string;
  title: string;
}

const getEmbedUrl = (url: string, autoplay: boolean) => {
  let base = url;
  if (url.includes("youtube.com/watch")) {
    base = url.replace("watch?v=", "embed/");
  } else if (url.includes("youtu.be/")) {
    base = `https://www.youtube.com/embed/${url.split("youtu.be/")[1]}`;
  }
  const sep = base.includes("?") ? "&" : "?";
  const params = autoplay
    ? `${sep}autoplay=1&mute=1&loop=1&controls=1&modestbranding=1&rel=0`
    : `${sep}controls=1&modestbranding=1&rel=0`;
  return `${base}${params}`;
};

const isDirectVideo = (url: string) =>
  /\.(mp4|webm|ogg)(\?|$)/i.test(url);

const AutoPlayVideo = ({ url, title }: AutoPlayVideoProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isVisible) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isVisible]);

  return (
    <AspectRatio ratio={16 / 9} className="mb-4 rounded-lg overflow-hidden bg-black">
      <div ref={ref} className="w-full h-full">
        {isDirectVideo(url) ? (
          <video
            ref={videoRef}
            src={url}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            controlsList="nodownload nofullscreen"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            title={title}
          />
        ) : (
          <iframe
            src={getEmbedUrl(url, isVisible)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title}
          />
        )}
      </div>
    </AspectRatio>
  );
};

export default AutoPlayVideo;
