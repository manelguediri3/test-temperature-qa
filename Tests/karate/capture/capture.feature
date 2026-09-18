Feature: POST /api/temperature/capture

  # Champs réels de la réponse : { id, temperature, state, coldMax, hotMin, timestamp }
  # Le POST renvoie le code HTTP 201 (Created), confirmé par test réel.
  # BUG-03 (Critique) : FIXED_TEMPERATURE est ignoré par cet endpoint, la
  # température capturée est toujours 25.5 peu importe la config.

  Background:
    * url baseUrl

  Scenario: Une capture renvoie une lecture cohérente
    Given path '/api/temperature/capture'
    When method post
    Then status 201
    And match response == { id: '#present', temperature: '#number', state: '#present', coldMax: '#number', hotMin: '#number', timestamp: '#present' }

  # BUG-03 documenté ici : la valeur est toujours 25.5, quelle que soit la
  # configuration FIXED_TEMPERATURE.
  Scenario: La température capturée correspond à la valeur actuelle par défaut (BUG-03)
    Given path '/api/temperature/capture'
    When method post
    Then status 201
    And match response.temperature == 25.5

  Scenario: Le statut renvoyé correspond aux seuils actifs (coldMax/hotMin)
    Given path '/api/thresholds'
    When method get
    Then status 200
    * def thresholds = response

    Given path '/api/temperature/capture'
    When method post
    Then status 201
    * def expectedState = response.temperature < thresholds.coldMax ? 'COLD' : (response.temperature >= thresholds.hotMin ? 'HOT' : 'WARM')
    And match response.state == expectedState

  Scenario: Une capture répétée alimente bien l'historique (pas de doublon d'ID)
    Given path '/api/temperature/capture'
    When method post
    Then status 201
    * def firstId = response.id

    Given path '/api/temperature/capture'
    When method post
    Then status 201
    And match response.id != firstId

  Scenario: L'historique ne dépasse jamais 15 éléments
    * def capturesToDo = 17
    * eval
    """
    for (var i = 0; i < capturesToDo; i++) {
      karate.call('classpath:karate/capture/do-one-capture.feature');
    }
    """
    Given path '/api/temperature/history'
    When method get
    Then status 200
    And assert response.count <= 15