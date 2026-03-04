import { useEffect, useRef } from "react";
import { createTimeline, createScope } from "animejs";

const AnimatedLogo = ({ className = "" }) => {
    const rootRef = useRef(null);
    const scopeRef = useRef(null);

    useEffect(() => {
        if (!rootRef.current) return;

        scopeRef.current = createScope({ root: rootRef }).add(() => {
            // Anime.js v4 timeline syntax
            const tl = createTimeline({ loop: true });

            // 1. English slides out (after 3.5s delay)
            tl.add(".logo-en", {
                translateY: [0, -25],
                opacity: [1, 0],
                duration: 800,
                ease: "inOutExpo",
                delay: 3500 // Hold for 3.5s
            });

            // 2. Japanese slides in (simultaneous)
            tl.add(".logo-ja", {
                translateY: [25, 0],
                opacity: [0, 1],
                duration: 800,
                ease: "inOutExpo",
            }, "-=800");

            // 3. Japanese slides out (after 3.5s delay)
            tl.add(".logo-ja", {
                translateY: [0, -25],
                opacity: [1, 0],
                duration: 800,
                ease: "inOutExpo",
                delay: 3500
            });

            // 4. English slides in (simultaneous)
            tl.add(".logo-en", {
                translateY: [25, 0],
                opacity: [0, 1],
                duration: 800,
                ease: "inOutExpo",
            }, "-=800");
        });

        return () => scopeRef.current?.revert();
    }, []);

    return (
        <div ref={rootRef} className={`relative h-8 flex items-center overflow-hidden ${className}`}>
            {/* English */}
            <h1
                className="logo-en absolute whitespace-nowrap text-text-primary font-bold tracking-tight text-xl md:text-2xl drop-shadow-md"
                style={{ opacity: 1, transform: 'translateY(0px)' }}
            >
                Frameverse
            </h1>
            {/* Japanese */}
            <h1
                className="logo-ja absolute whitespace-nowrap text-text-primary font-bold tracking-wide text-lg md:text-[21px] drop-shadow-md"
                style={{ opacity: 0, transform: 'translateY(25px)' }}
            >
                フレームバース
            </h1>
        </div>
    );
};

export default AnimatedLogo;
