import Image from "next/image";
import Link from "next/link";
import { StarsDisplay } from "./MovieReviews";

const MovieCard = ({ movie }) => {
    return (
        <div className="w-full flex flex-col h-full">
            <Link href={`/movie/${movie?.slug}`}>
                <div className="aspect-2/3 overflow-hidden">
                    <Image
                        src={movie?.posterUrl}
                        alt={movie?.title}
                        width={180}
                        height={270}
                        className="w-full h-full object-cover"
                    />
                </div>
            </Link>

            <div className="py-2 flex flex-col flex-1">
                <Link href={`/movie/${movie?.slug}`} className="link-logo">
                    <h3 className="text-lg line-clamp-2 min-h-14">
                        {movie?.title}
                    </h3>
                </Link>

                <div className="flex items-start gap-2 mt-2">
                    <StarsDisplay value={movie?.ratingReviews?.[0]?.rating || 0} />

                    <span className="text-sm text-(--color-text-muted)">
                        {movie?._count?.ratingReviews}
                    </span>
                </div>
            </div>
        </div>
    )
};

export default MovieCard;