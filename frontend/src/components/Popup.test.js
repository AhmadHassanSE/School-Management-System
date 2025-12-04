import React from 'react';
import { render, screen } from '@testing-library/react';
import Popup from '../Popup';

test('renders Popup component', () => {
    render(<Popup />);
    const popupElement = screen.getByText(/popup content/i);
    expect(popupElement).toBeInTheDocument();
});

test('handles props correctly', () => {
    const { rerender } = render(<Popup title="Test Title" />);
    expect(screen.getByText(/test title/i)).toBeInTheDocument();
    
    rerender(<Popup title="New Title" />);
    expect(screen.getByText(/new title/i)).toBeInTheDocument();
});

test('handles state changes', () => {
    const { getByText } = render(<Popup />);
    const button = getByText(/toggle/i);
    button.click();
    expect(getByText(/new state/i)).toBeInTheDocument();
});