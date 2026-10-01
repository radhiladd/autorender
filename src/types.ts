export type Plan = {
  id: string
  name: string
}

export type Collection = {
  id: string
  name: string
  parentId?: string | null
}

export type PersonName = {
  firstName: string
  lastName: string
}

export type SessionSetup = {
  elevation: string | null
  optionCount: number
  options: string[]
  styleId: string
  styleName: string
  styleParams: StyleParams | null
  camera: string
  aspect: string
  prompt: string
}

export type Session = {
  id: string
  planId: string
  createdAt: string
  styleLabel: string
  createdBy: PersonName
  setup?: SessionSetup
}

export type Render = {
  id: string
  planId: string
  sessionId: string
  collectionIds: string[]
  name: string
  image: string
  createdAt: string
  downloadable: boolean
  prompt?: string
  refined?: boolean
}

export type StyleParams = {
  renderStyle: 'Photorealistic' | 'Watercolor' | 'Architectural Sketch'
  timeOfDay: 'Dawn' | 'Morning' | 'Midday' | 'Dusk' | 'Sunset'
  weather: 'Clear Sky' | 'Partly Cloudy' | 'After Rain'
  scene: 'Mountain' | 'Country' | 'Desert' | 'Community' | 'Forest'
  landscaping: number
  flowerbedCover: 'Wood Nuggets' | 'Pine Straw' | 'Dark Soil'
  yardCover: 'Grass' | 'Freshly Mowed Grass' | 'Rocks' | 'Pea Gravel' | 'Native Ground Cover' | 'Texture'
  staging: 'Yes' | 'No'
  windowTreatments: 'Nothing' | 'Curtains' | 'Blinds'
  mode: 'low' | 'high'
}

export type Style = {
  id: string
  name: string
  description: string
  params: StyleParams
}

export type LibraryState = {
  plans: Plan[]
  collections: Collection[]
  sessions: Session[]
  renders: Render[]
  styles: Style[]
}
