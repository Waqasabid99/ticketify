import { StarRating } from "@/utils/constants"
import Image from "next/image"
import Link from "next/link";

const MovieCard = ({ movie }) => {
    return (
        <div href={movie.title} className="w-full">
            <Link href={`/movie/${movie?.slug}`}>
                <Image src={movie?.posterUrl} alt={movie?.title} width={180} height={180} />
            </Link>
            <div className="py-3 flex flex-col">
                <Link href={`/movie/${movie?.slug}`} className="link-logo">
                    <h3 className="text-lg">{movie?.title}</h3>
                </Link>
                <div className="flex">
                    <StarRating rating={movie?.rating} />
                    <span className="text-[12px]">{movie?.votes}</span>
                </div>
            </div>
        </div>
    )
};

export default MovieCard;