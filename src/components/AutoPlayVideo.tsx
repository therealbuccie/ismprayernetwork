import { AspectRatio } from "@/components/ui/aspect-ratio";

interface AutoPlayVideoProps {
  url: string;
  title: string;
}

const getEmbedUrl = (url: string) => {
  let base = url;
  if (url.includes("youtube.com/watch")) {
    base = url.replace("watch?v=", "embed/");
  } else if (url.includes("youtu.be/")) {
    base = `https://www.youtube.com/embed/${url.split("youtu.be/")[1]}`;
  }
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}autoplay=1&mute=1&loop=1&controls=1&modestbranding=1&rel=0`;
};

const isDirectVideo = (url: string) =>
  /\.(mp4|webm|ogg)(\?|$)/i.test(url);

const AutoPlayVideo = ({ url, title }: AutoPlayVideoProps) => {
  return (
    <AspectRatio ratio={16 / 9} className="mb-4 rounded-lg overflow-hidden bg-black">
      {isDirectVideo(url) ? (
        <video
          src={url}
          className="w-full h-full object-cover"
          autoPlay
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
          src={getEmbedUrl(url)}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title}
        />
      )}
    </AspectRatio>
  );
};

export default AutoPlayVideo;
