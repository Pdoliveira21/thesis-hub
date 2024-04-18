export const dictionary = {
  // Timeline
  play: "Iniciar",
  pause: "Pausar",
  prev: "Anterior",
  next: "Próximo",
  current: "Actual",

  // Controls
  sort: "Ordenar",
  filter: "Filtrar",
  search: "Pesquisar",
  find: "Encontrar",
  by: "por",
  all: "Todos",

  // Messages
  loading_data: "A carregar informações...",
  error_loading_data: "Erro ao carregar informações.",
  discarding_filters: "sem considerar os filtros",

  // Groups (translate dataset groups to human readable labels)
  dataset_groups: {
    "players": "Jogadores",
    "teams": "Equipas",
    "national teams": "Seleções",
  },

  // Fields (translate dataset fields to human readable labels and options)
  dataset_fields: {
    name: "Nome",
    fk_continente: {
      label: "Continente",
      options: {
        1: { label: "Europa", color: "#0a52a4" },
        2: { label: "Ásia", color: "#fdc00a" },
        3: { label: "América do Norte", color: "#128631" },
        4: { label: "América do Sul", color: "#a6006c" },
        5: { label: "África", color: "#ea6607" },
        6: { label: "Oceânia", color: "#da0012" },
      },
    },
    posicao: { label: "Posição", options: {} },
    continente: { label: "Continente", options: {} },
    country: { label: "País", options: {} },
  },
};