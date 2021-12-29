import React, { useEffect } from 'react';

import useIntersectionObserver, { ObserverProps } from './useIntersectionObserver';

interface WrapperProps extends ObserverProps {
    onVisibilityChange?: (isVisible?: boolean) => void;
    children?: React.ReactNode;
    className?: string;
    style?: { [key: string]: string };
}

/**
 * Wrapper which adds intersection observer to a react component.
 * onVisibiliyChange callback is fired as soon as the element enters view port at specified threshold.
 */

const InView = ({
    rootMargin,
    threshold,
    onIntersect,
    onVisibilityChange,
    children,
    ...rest
}: WrapperProps) => {
    const { ref, isVisible } = useIntersectionObserver({
        rootMargin,
        threshold,
        onIntersect
    });

    useEffect(() => {
        if (onVisibilityChange) onVisibilityChange(isVisible);
    }, [isVisible]);

    return (
        <div ref={ref} {...rest}>
            {children}
        </div>
    );
};

export default InView;