// Test simple para verificar configuración
describe('Test Configuration', () => {
  it('should run basic test', () => {
    expect(1 + 1).toBe(2);
  });
  
  it('should have access to DOM', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello Test';
    expect(div.textContent).toBe('Hello Test');
  });
});
