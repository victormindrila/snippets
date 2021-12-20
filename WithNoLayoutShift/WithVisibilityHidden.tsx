import React from 'react';

interface Props {
    childrenVisible: boolean;
    children: JSX.Element | JSX.Element[];
    as?: keyof HTMLElementTagNameMap;
}

export const getVisibilityStyle = ({
    isVisible = true
}: {
    isVisible: boolean;
}): { visibility: 'hidden' | 'visible' } => {
    return {
        visibility: isVisible ? 'visible' : 'hidden'
    };
};

const WithVisibilityHidden = ({ childrenVisible, as, children }: Props) => {
    const Container: React.ComponentType<React.HTMLAttributes<HTMLDivElement>> = (as ||
        'div') as any;

    if (as || Array.isArray(children)) {
        return (
            <Container style={getVisibilityStyle({ isVisible: childrenVisible })}>
                {children}
            </Container>
        );
    }

    return React.cloneElement(children, {
        style: getVisibilityStyle({ isVisible: childrenVisible })
    });
};

export default WithVisibilityHidden;