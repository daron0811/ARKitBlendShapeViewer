using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using System.Text.RegularExpressions;

public class BlendShapeManager : MonoBehaviour {

	public SkinnedMeshRenderer _skinMesh;

	public string PastName = ".";
//	public BlendShapeController _BlendShapeController;

	public GameObject _BtnItem;
	public Transform ContentOBJ;

	public float basicHeight = 60.0f;
	public RectTransform layoutTransform;


	public Button Btn_reset;

	public Toggle[] _toggleType;

	public GameObject InfoPanel;
	public string SelectName ="All";

	// Use this for initialization
	void Start () {
		for (int i = 0; i < _skinMesh.sharedMesh.blendShapeCount; i++) {
//			Debug.Log (_skinMesh.sharedMesh.GetBlendShapeName(i));
			GameObject _target = GameObject.Instantiate (_BtnItem, ContentOBJ);
			_target.name = _skinMesh.sharedMesh.GetBlendShapeName (i);

			BlendShapeController _blendShape = _target.GetComponent<BlendShapeController> ();
			_blendShape.BlendShapeName.text = _target.name.Replace (PastName, "");
			_blendShape.SliderValue.value = _skinMesh.GetBlendShapeWeight (i);
			_blendShape.BlendShapeValue.text = _blendShape.SliderValue.value.ToString ();
			_blendShape.SliderValue.onValueChanged.AddListener (delegate {
				OnBlendShapeValueChange(_target);
			});
		}
		Btn_reset.onClick.AddListener (ResetBlendShape);

		for (int i = 0; i < _toggleType.Length; i++) {
			GameObject target = _toggleType [i].gameObject;
//			_toggleType [i].onValueChanged.AddListener (delegate {
//				TypeSelect (target);
//			});
			_toggleType [i].onValueChanged.AddListener (delegate(bool arg0) {
				TypeSelect (target,arg0);
			});
		}

		layoutTransform.sizeDelta = new  Vector2(layoutTransform.sizeDelta.x, 60.0f * ContentOBJ.childCount);
	}

	void OnBlendShapeValueChange(GameObject _objectname)
	{
		float _changeValue = _objectname.GetComponent<BlendShapeController> ().SliderValue.value;
		_skinMesh.SetBlendShapeWeight (_skinMesh.sharedMesh.GetBlendShapeIndex (_objectname.name),_changeValue);
		_objectname.GetComponent<BlendShapeController> ().BlendShapeValue.text = _changeValue.ToString ();
	}

	void ResetBlendShape()
	{

		for (int i = 0; i < ContentOBJ.childCount; i++) {
			ContentOBJ.GetChild(i).GetComponent<BlendShapeController> ().SliderValue.value=0;
			_skinMesh.SetBlendShapeWeight (_skinMesh.sharedMesh.GetBlendShapeIndex (ContentOBJ.GetChild(i).name),0);
			ContentOBJ.GetChild (i).GetComponent<BlendShapeController> ().BlendShapeValue.text = "0";
		}

	}


	public void SetInfoPanel()
	{
			InfoPanel.SetActive (!InfoPanel.activeInHierarchy);
	}

	public void LinkURL(string URL)
	{
		Application.OpenURL (URL);
	}


	public void TypeSelect(GameObject targetValue,bool value)
	{
		if (!value) {
			return;
		}

		SelectName = targetValue.name;

		int count = 0;
		switch (SelectName) {
		case "All":
			for (int i = 0; i < ContentOBJ.childCount; i++) {
				count++;
				ContentOBJ.GetChild (i).gameObject.SetActive (true);
			}
			break;
		
		case "Eyes":
			for (int i = 0; i < ContentOBJ.childCount; i++) 
			{
				
				if (Regex.IsMatch (ContentOBJ.GetChild (i).name, "eye", RegexOptions.IgnoreCase)) {
//					Debug.Log (ContentOBJ.GetChild (i).name);
					ContentOBJ.GetChild (i).gameObject.SetActive (true);
					count++;
				} else if (Regex.IsMatch (ContentOBJ.GetChild (i).name, "brow", RegexOptions.IgnoreCase)) {
//					Debug.Log (ContentOBJ.GetChild (i).name);
					ContentOBJ.GetChild (i).gameObject.SetActive (true);
					count++;
				} else {
					ContentOBJ.GetChild (i).gameObject.SetActive (false);
				}
//				ContentOBJ.GetChild (i).gameObject.SetActive (true);
			}
			break;
		case "Mouth":
			for (int i = 0; i < ContentOBJ.childCount; i++) 
			{

				if (Regex.IsMatch (ContentOBJ.GetChild (i).name, "mouth", RegexOptions.IgnoreCase)) {
//					Debug.Log (ContentOBJ.GetChild (i).name);
					ContentOBJ.GetChild (i).gameObject.SetActive (true);
					count++;
				} else if (Regex.IsMatch (ContentOBJ.GetChild (i).name, "jaw", RegexOptions.IgnoreCase)) {
//					Debug.Log (ContentOBJ.GetChild (i).name);
					ContentOBJ.GetChild (i).gameObject.SetActive (true);
					count++;
				} else {
					ContentOBJ.GetChild (i).gameObject.SetActive (false);
				}
				//				ContentOBJ.GetChild (i).gameObject.SetActive (true);
			}
			break;
		case "Other":
			for (int i = 0; i < ContentOBJ.childCount; i++) 
			{

				if (Regex.IsMatch (ContentOBJ.GetChild (i).name, "mouth", RegexOptions.IgnoreCase)) {
//					Debug.Log (ContentOBJ.GetChild (i).name);
					ContentOBJ.GetChild (i).gameObject.SetActive (false);
//					count++;
				} else if (Regex.IsMatch (ContentOBJ.GetChild (i).name, "jaw", RegexOptions.IgnoreCase)) {
//					Debug.Log (ContentOBJ.GetChild (i).name);
					ContentOBJ.GetChild (i).gameObject.SetActive (false);
//					count++;
				}
				else if (Regex.IsMatch (ContentOBJ.GetChild (i).name, "eye", RegexOptions.IgnoreCase)) {
//					Debug.Log (ContentOBJ.GetChild (i).name);
					ContentOBJ.GetChild (i).gameObject.SetActive (false);
//					count++;
				} else if (Regex.IsMatch (ContentOBJ.GetChild (i).name, "brow", RegexOptions.IgnoreCase)) {
//					Debug.Log (ContentOBJ.GetChild (i).name);
					ContentOBJ.GetChild (i).gameObject.SetActive (false);
//					count++;
				} else {
					ContentOBJ.GetChild (i).gameObject.SetActive (true);
					count++;
				}
				//				ContentOBJ.GetChild (i).gameObject.SetActive (true);
			}
			break;
		default:
			for (int i = 0; i < ContentOBJ.childCount; i++) {
				ContentOBJ.GetChild (i).gameObject.SetActive (false);
				count++;
			}
			break;
		}
		Debug.Log (count);
		layoutTransform.sizeDelta = new  Vector2(layoutTransform.sizeDelta.x, 60.0f * count);
	}
}
