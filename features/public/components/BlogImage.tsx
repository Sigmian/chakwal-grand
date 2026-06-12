"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const PLACEHOLDER = "/images/placeholder/guest-house-placeholder.svg";

type Props = Omit<ImageProps, "onError"> & { fallbackSrc?: string };

export function BlogImage({ src, alt, fallbackSrc = PLACEHOLDER, ...props }: Props) {
  const [imgSrc, setImgSrc] = useState(src);
  const [errored, setErrored] = useState(false);

  return (
    <Image
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => {
        if (!errored) {
          setErrored(true);
          setImgSrc(fallbackSrc);
        }
      }}
    />
  );
}
