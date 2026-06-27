import Image from "next/image";

const logoSrc = "/konten.com%20asset.jpg";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg";
};

const sizeClassName = {
  sm: "h-9 w-9",
  md: "h-11 w-11",
  lg: "h-14 w-14",
};

export function BrandLogo({ size = "md" }: BrandLogoProps) {
  return (
    <span
      className={`${sizeClassName[size]} relative overflow-hidden rounded-md shadow-[0_12px_34px_rgba(254,85,1,0.28)]`}
    >
      <Image
        src={logoSrc}
        alt="Kasbon Tracker"
        fill
        className="object-cover"
        sizes="56px"
        priority={size === "lg"}
      />
    </span>
  );
}
