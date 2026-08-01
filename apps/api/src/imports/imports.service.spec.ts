describe('Import row mapping normalization', () => {
  const normalizeKey = (key: string) =>
    key
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');

  it('normalizes accented headers', () => {
    expect(normalizeKey('Teléfono')).toBe('telefono');
    expect(normalizeKey('Tipo Documento')).toBe('tipodocumento');
    expect(normalizeKey('Apellidos')).toBe('apellidos');
  });
});
