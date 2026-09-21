export type Plan = {
  id: string
  name: string
}

export type Folder = {
  id: string
  planId: string
  name: string
  parentId?: string | null
}

export type PersonName = {
  firstName: string
  lastName: string
}

export type Session = {
  id: string
  planId: string
  createdAt: string
  styleLabel: string
  createdBy: PersonName
}

export type Render = {
  id: string
  planId: string
  sessionId: string
  folderId: string | null
  name: string
  image: string
  createdAt: string
  downloadable: boolean
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
  folders: Folder[]
  sessions: Session[]
  renders: Render[]
  styles: Style[]
}
