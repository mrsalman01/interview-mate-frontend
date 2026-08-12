import Image from "next/image";

export default function Logo(params: { src?: string }) {
  return (
    <Image
      src={params.src || "/Interventa.png"}
      alt="Intervanta"
      width={180}
      height={180}
      priority
    />
  );
}