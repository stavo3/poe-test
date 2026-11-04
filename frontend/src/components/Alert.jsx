export default function Alert({ type = 'error', message }) {
  // If no message is supplied, the component renders nothing.
  if (!message) return null;

  return (
    // The alert role supports accessibility for dynamically displayed messages.
    <div className={`alert alert-${type}`} role="alert" data-testid={`alert-${type}`}>
      {message}
    </div>
  );
}

// REFERENCES
 
 // MDN Web Docs (n.d.) 'Conditional (ternary) operator'.
 // Available at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_operator
  // Accessed: 25 August 2026.
 
 // MDN Web Docs (n.d.) 'Template literals'.
 //Available at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
// Accessed: 25 August 2026
 
 //React (n.d.) 'Your first component'.
 //Available at:https://react.dev/learn/your-first-component
// Accessed: 25 August 2026
 
  // React (n.d.) 'Passing props to a component'.
 //Available at: https://react.dev/learn/passing-props-to-a-component
//  Accessed: 27 August 2026
 
 // W3C (n.d.) 'ARIA role="alert"'.
 // Available at: https://www.w3.org/TR/wai-aria-1.2/#alert
 // Accessed: 27 August 2026
