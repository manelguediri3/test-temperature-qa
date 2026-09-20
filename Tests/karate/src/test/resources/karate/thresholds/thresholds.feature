Feature: GET/PUT /api/thresholds

  # Champs réels de l'API : { coldMax: number, hotMin: number }
  # Règle métier confirmée : gap minimum de 2°C entre coldMax et hotMin
  # coldMax doit toujours être strictement inférieur à hotMin

  Background:
    * url baseUrl

  Scenario: GET renvoie les seuils actuels avec coldMax strictement inférieur à hotMin
    Given path '/api/thresholds'
    When method get
    Then status 200
    And match response == { coldMax: '#number', hotMin: '#number' }
    And assert response.coldMax < response.hotMin

  Scenario: PUT avec des valeurs valides met à jour les seuils
    Given path '/api/thresholds'
    And request { coldMax: 10, hotMin: 30 }
    When method put
    Then status 200
    And match response == { coldMax: 10, hotMin: 30 }

    Given path '/api/thresholds'
    When method get
    Then status 200
    And match response == { coldMax: 10, hotMin: 30 }

  Scenario: PUT avec coldMax >= hotMin doit être rejeté (400 attendu)
    Given path '/api/thresholds'
    And request { coldMax: 30, hotMin: 10 }
    When method put
    Then status 400

  Scenario: PUT avec un gap inférieur à 2°C doit être rejeté (400 attendu)
    Given path '/api/thresholds'
    And request { coldMax: 20, hotMin: 21 }
    When method put
    Then status 400

  # BUG-01 (Majeur) : un type invalide dans le body provoque une erreur 500
  # au lieu du 400 attendu. Ce test échoue intentionnellement pour documenter
  # le bug tant qu'il n'est pas corrigé par l'équipe de dev.
  Scenario: PUT avec un type invalide (string) devrait renvoyer 400 mais renvoie 500 (BUG-01)
    Given path '/api/thresholds'
    And request { coldMax: 'abc', hotMin: 35 }
    When method put
    Then status 400

  # BUG-02 (Majeur) : un body incomplet (champ manquant) devrait être rejeté
  # avec un 400, mais l'API renvoie 200 en gardant les valeurs existantes
  # inchangées. Ce test échoue intentionnellement pour documenter le bug.
  Scenario: PUT avec un champ manquant devrait renvoyer 400 mais renvoie 200 (BUG-02)
    Given path '/api/thresholds'
    And request { coldMax: 22 }
    When method put
    Then status 400