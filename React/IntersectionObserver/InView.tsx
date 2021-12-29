import React, { useEffect } from 'react';

import useIntersectionObserver, { ObserverProps } from './useIntersectionObserver';

interface WrapperProps extends ObserverProps {
    onVisibilityChange?: (isVisible?: boolean) => void;
    children?: React.ReactNode;
    className?: string;
    style?: { [key: string]: string };
}

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