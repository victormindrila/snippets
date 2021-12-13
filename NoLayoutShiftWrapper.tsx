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

/**
 * HOC that wraps over a React Component that must be hidden. 
 * Removes the children from DOM and prevents layout shift.
 */

const NoLayoutShiftWrapper = ({ isVisible, children }: WrapperProps): JSX.Element => {
    const ref = useRef<HTMLDivElement>();
    const [showChildren, setShowChildren] = useState(true);
    const [height, setHeight] = useState(0);

    useLayoutEffect(() => {
        if (ref.current) {
            const elementHeight = getElAbsoluteHeight(ref.current);
            setHeight(elementHeight);
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

/**
 * usage
 * 
 * <NoLayoutShiftWrapper isVisible={isVisible}>
 *  <MyComponent />
 * </NoLayoutShiftWrapper>
 */
