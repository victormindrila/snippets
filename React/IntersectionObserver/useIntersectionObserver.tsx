import { useEffect, useRef, useState } from 'react';

export interface ObserverProps extends IntersectionObserverInit {
    threshold: number[];
    onIntersect?: (element?: IntersectionObserverEntry) => void;
}

const useIntersectionObserver = <T extends HTMLElement> ({ rootMargin, threshold, onIntersect }: ObserverProps) => {
    const ref = useRef<T>();
    const [isVisible, setIsVisible] = useState<boolean>(true);

    useEffect(() => {
        const onIntersectCb = ([element]: Array<IntersectionObserverEntry>) => {
            const inView =
                element.isIntersecting &&
                threshold.some((threshold) => element.intersectionRatio >= threshold);

            if (element.isIntersecting && onIntersect) {
                onIntersect(element);
            }

            if (element.isIntersecting && inView) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        const options = {
            rootMargin,
            threshold
        };

        const observer = new IntersectionObserver(onIntersectCb, options);

        const target = ref.current;

        if (target) observer.observe(target);
        return () => {
            if (target) observer.unobserve(target);
            observer.disconnect();
        };
    }, [ref.current]);

    return { ref, isVisible };
};

export default useIntersectionObserver;