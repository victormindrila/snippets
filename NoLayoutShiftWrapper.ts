import React from 'react'; 

interface WrapperProps {
    isVisible: boolean;
    children: React.ReactElement | React.ReactElement[];
}

const getElAbsoluteHeight = (el: HTMLElement): number => {
    if (!el) return 0;

    const styles = getComputedStyle(el);
    const margin = parseFloat(styles['marginTop']) + parseFloat(styles['marginBottom']);

    return Math.ceil(el.offsetHeight + margin);
};

const NoLayoutShiftWrapper = ({ isVisible, children }: WrapperProps): JSX.Element => {
    const ref = useRef<HTMLDivElement>();
    const [showChildren, setShowChildren] = useState(true);
    const [height, setHeight] = useState(0);

    useLayoutEffect(() => {
        if (ref.current) {
            const elementHeights = getElAbsoluteHeight(ref.current);
            setHeight(elementHeights);
        }

        if (!isVisible) {
            setShowChildren(false);
        }
    }, [isVisible, ref.current]);

    // swap content with placeholder
    if (!showChildren) {
        return <div style={{ height }}></div>;
    }
    
    // must return a single element and can not pass ref to React.Fragment
    return Array.isArray(children) ? (
        <div ref={ref}>{children}</div>
    ) : (
        React.cloneElement(children, {
            ref: ref
        })
    );
};
