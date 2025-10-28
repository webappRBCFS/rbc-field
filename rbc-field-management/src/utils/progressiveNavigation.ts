/**
 * Utility functions for progressive tab navigation in create/edit forms
 */

export interface TabConfig<T extends string> {
  name: T
  displayName: string
  required: boolean
  validator?: () => boolean
}

export function createNavigationHelpers<T extends string>(
  tabs: T[],
  getActiveTab: () => T,
  setActiveTab: (tab: T) => void
) {
  const validateTab = (tab: T, validators: Map<T, () => boolean>): boolean => {
    const validator = validators.get(tab)
    return validator ? validator() : true
  }

  const handleNext = (
    validators: Map<T, () => boolean>,
    onValidationError?: (message: string) => void
  ) => {
    const currentTab = getActiveTab()
    if (!validateTab(currentTab, validators)) {
      const errorMessage = 'Please fill in all required fields before continuing'
      if (onValidationError) {
        onValidationError(errorMessage)
      } else {
        alert(errorMessage)
      }
      return
    }

    const currentIndex = tabs.indexOf(currentTab)
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1])
    }
  }

  const handleBack = () => {
    const currentIndex = tabs.indexOf(getActiveTab())
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1])
    }
  }

  const isLastTab = (): boolean => {
    const currentIndex = tabs.indexOf(getActiveTab())
    return currentIndex === tabs.length - 1
  }

  const isFirstTab = (): boolean => {
    return getActiveTab() === tabs[0]
  }

  return {
    validateTab,
    handleNext,
    handleBack,
    isLastTab,
    isFirstTab,
  }
}
