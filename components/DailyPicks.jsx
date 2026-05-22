import React, { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import useSWR from "swr";
import Image from "next/image";
import { TMDB_BLUR_DATA_URL } from "../lib/imageBlur";
import HoverCard from "./cards/HoverCard";

const DAILYSWIFT_KEY = "/api/recommendations?daily=true";

function formatRuntime(runtime) {
    if (!runtime) return null;
    if (typeof runtime === "string") return runtime;
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function yearFor(item) {
    return (item.release_date || item.first_air_date || "").slice(0, 4);
}

function genreNames(item) {
    if (Array.isArray(item.genres) && item.genres.length) {
        return item.genres.map((genre) => genre.name || genre).filter(Boolean).slice(0, 3);
    }

    if (Array.isArray(item.genreNames) && item.genreNames.length) {
        return item.genreNames.slice(0, 3);
    }

    if (Array.isArray(item.genre_names) && item.genre_names.length) {
        return item.genre_names.slice(0, 3);
    }

    return [];
}

function metaFor(item, isTV) {
    if (isTV) {
        if (item.number_of_seasons) {
            return `${item.number_of_seasons} Season${item.number_of_seasons > 1 ? "s" : ""}`;
        }
        return "Series";
    }

    return formatRuntime(item.runtime);
}

function SkeletonCard() {
    return (
        <div className="flex-shrink-0 w-[140px] md:w-[160px] flex flex-col gap-2">
            <div className="w-full aspect-[2/3] rounded-xl bg-neutral-800 animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-neutral-800 animate-pulse mt-1" />
            <div className="h-3 w-1/2 rounded-full bg-neutral-800 animate-pulse" />
        </div>
    );
}

function CardDetails({ item, isTV }) {
    const providers = item.providers || [];
    const genres = genreNames(item);
    const year = yearFor(item);
    const meta = metaFor(item, isTV);

    return (
        <>
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-neutral-200" aria-label={`Play ${item.title || item.name}`}>
                        <svg className="ml-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </button>
                    <button className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-neutral-500 text-lg text-white transition-colors hover:border-white" aria-label={`Add ${item.title || item.name} to list`}>
                        +
                    </button>
                    <button className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-neutral-500 transition-colors hover:border-white" aria-label={`Like ${item.title || item.name}`}>
                        <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 1.961L7 13m7-3h-4" />
                        </svg>
                    </button>
                </div>
                <button className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-neutral-500 transition-colors hover:border-white" aria-label={`More about ${item.title || item.name}`}>
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </div>

            <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-emerald-400">
                    {(item.vote_average || 0).toFixed(1)} ★
                </span>
                {year ? <span className="text-neutral-400">{year}</span> : null}
                {meta ? <span className="rounded border border-neutral-600 px-1 text-[10px] text-neutral-400">{meta}</span> : null}
                <span className="rounded border border-neutral-600 px-1 text-[10px] text-neutral-400">HD</span>
            </div>

            {genres.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1">
                    {genres.map((genre, index) => (
                        <span key={`${genre}-${index}`} className="text-xs text-neutral-300">
                            {genre}
                            {index < genres.length - 1 ? <span className="mx-1 text-neutral-600">•</span> : null}
                        </span>
                    ))}
                </div>
            ) : null}

            {providers.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                    {providers.slice(0, 2).map((provider, index) => (
                        <span
                            key={`${provider}-${index}`}
                            className="rounded bg-white/10 px-2 py-0.5 text-[10px] capitalize text-neutral-300"
                        >
                            {provider}
                        </span>
                    ))}
                </div>
            ) : null}

        </>
    );
}

function DailyPickRow({ label, items, isLoading, onPlayTrailer }) {
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        scrollRef.current?.scrollBy({
            left: direction === "left" ? -600 : 600,
            behavior: "smooth",
        });
    };

    return (
        <div className="relative group/row">
            <div className="mb-3 flex items-center justify-between px-4">
                <h3 className="flex items-center gap-2 text-lg font-bold">
                    <span className="h-5 w-1 rounded-full bg-red-500" />
                    {label}
                </h3>
                <div className="hidden gap-2 opacity-0 transition-opacity group-hover/row:opacity-100 md:flex">
                    <button
                        onClick={() => scroll("left")}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xl leading-none text-white hover:bg-white/20"
                        aria-label={`Scroll ${label} left`}
                    >
                        ‹
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xl leading-none text-white hover:bg-white/20"
                        aria-label={`Scroll ${label} right`}
                    >
                        ›
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-3 overflow-x-auto px-4 py-6 scroll-row"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
                <style>{`.scroll-row::-webkit-scrollbar{display:none}`}</style>
                {isLoading
                    ? Array(5).fill(null).map((_, index) => <SkeletonCard key={index} />)
                    : items.map((item, i) => (
                        <HoverCard key={item.id} item={item} index={i} showTopBadge onPlayTrailer={onPlayTrailer} />
                    ))}
            </div>
        </div>
    );
}

export default function DailyPicks({ className = "", onPlayTrailer, recs }) {
    if (!recs) return null;

    const movies = (recs?.movies || []).slice(0, 5);
    const series = (recs?.tv || recs?.series || []).slice(0, 5);

    const combined = [];
    const maxLength = Math.max(movies.length, series.length);
    for (let i = 0; i < maxLength; i++) {
        if (movies[i]) combined.push(movies[i]);
        if (series[i]) combined.push(series[i]);
    }

    if (combined.length === 0) return null;

    return (
        <section className={`mb-16 ${className}`}>
            <div className="mx-auto max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-6 px-4"
                >
                    <h2 className="mb-2 text-2xl font-black text-white md:text-4xl">
                        🔥 Today's Picks For You
                    </h2>
                    <p className="max-w-2xl text-sm text-neutral-400 md:text-base">
                        Your personalized daily picks based on tastes, availability, and what's hot right now
                    </p>
                </motion.div>

                <div className="space-y-2">
                    <DailyPickRow label="Top Picks" items={combined} isLoading={false} onPlayTrailer={onPlayTrailer} />
                </div>
            </div>
        </section>
    );
}
