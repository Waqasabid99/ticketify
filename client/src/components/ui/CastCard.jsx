import Image from "next/image"
import Link from "next/link";

const CastCard = ({ cast }) => {
    return (
        <div href={cast.slug} className="w-full">
            <Link href={`/${cast?.slug}`}>
                <Image src={cast?.profileUrl} alt={cast?.name} width={180} height={180} />
            </Link>
            <div className="py-3 flex flex-col">
                <Link href={`/${cast?.slug}`} className="link-logo">
                    <h3 className="text-lg">{cast?.name}</h3>
                </Link>
                <span className="text-[12px]">{cast?.role}</span>
            </div>
        </div>
    )
};

export default CastCard;