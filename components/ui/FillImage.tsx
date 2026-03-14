import Image, { type ImageProps } from "next/image";

type FillImageProps = Omit<ImageProps, "fill" | "src"> & {
  src: string;
};

function isVectorAsset(src: string): boolean {
  return src.startsWith("data:image/svg+xml") || /\.svg(?:[?#].*)?$/i.test(src);
}

export default function FillImage({ alt, sizes, src, unoptimized, ...props }: FillImageProps) {
  return (
    <Image
      alt={alt}
      fill
      sizes={sizes}
      src={src}
      unoptimized={unoptimized ?? isVectorAsset(src)}
      {...props}
    />
  );
}
