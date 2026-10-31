export function captureProposalSnapshot(snapshot) {
  const copy = JSON.parse(JSON.stringify(snapshot));
  function freeze(value) {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  }
  return freeze(copy);
}

export function buildProposalComposition(snapshot) {
  const investment = snapshot.investment || {};
  const waiters = Number(snapshot.waiters) || 0;
  const carts = Number(snapshot.totalCarts) || 0;
  const preparers = Number(snapshot.preparers) || 0;
  const lines = [
    { label: 'Cardápio selecionado', value: Number(investment.productsValue) || 0 },
    { label: `${carts} ${carts === 1 ? 'carrinho' : 'carrinhos'} · ${preparers} ${preparers === 1 ? 'profissional de preparo' : 'profissionais de preparo'}`, value: Number(investment.cartsValue) || 0 },
    { label: waiters ? `${waiters} ${waiters === 1 ? 'garçom incluído' : 'garçons incluídos'}` : 'Garçons: não incluídos', value: waiters ? Number(investment.waitersValue) || 0 : null },
    { label: snapshot.includeDisposables ? 'Descartáveis incluídos' : 'Descartáveis: não incluídos', value: snapshot.includeDisposables ? Number(investment.disposablesValue) || 0 : null },
  ];
  if (Number(investment.additionalHoursValue) > 0) lines.push({ label: 'Horas adicionais', value: Number(investment.additionalHoursValue) });
  return lines;
}
