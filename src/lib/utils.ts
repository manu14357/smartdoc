import { type ClassValue, clsx } from "clsx";
import { Metadata } from "next";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteUrl(path: string) {
  if (typeof window !== "undefined") return path;

  return `https://smartdoc-three.vercel.app${path}`;
}

export function constructMetadata({
  title = "SmartDoc - the SaaS for students",
  description = "SmartDoc.",
  image = "/thumbnail.png",
  icons = "/favicon.ico",
  noIndex = false,
}: {
  title?: string;
  description?: string;
  image?: string;
  icons?: string;
  noIndex?: boolean;
} = {}): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: image,
        },
      ],
    },
    icons,
    metadataBase: new URL("https://smartdoc-three.vercel.app"),
    themeColor: "#1D4ED8",
    ...(noIndex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
  };
}
